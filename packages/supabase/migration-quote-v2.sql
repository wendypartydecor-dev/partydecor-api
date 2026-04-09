-- ============================================================================
-- AUREA — Hito 5: Smart Quote Engine Persistence (V2)
-- ============================================================================
-- Migration: Sistema de Cotizaciones con Snapshots y Impuestos por Línea
-- Nombre tabla: lineas_cotizacion (NO quote_items)
-- ============================================================================
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: CONFIGURACIÓN FISCAL EN EMPRESAS
-- ============================================================================

ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS iva_default numeric(5,2) DEFAULT 16.00,
ADD COLUMN IF NOT EXISTS isr_default numeric(5,2) DEFAULT 1.25;

COMMENT ON COLUMN public.empresas.iva_default IS 'Porcentaje de IVA por defecto para cotizaciones (ej: 16.00)';
COMMENT ON COLUMN public.empresas.isr_default IS 'Porcentaje de ISR retención por defecto para cotizaciones (ej: 1.25)';

-- ============================================================================
-- SECCIÓN 2: TABLA lineas_cotizacion (ítems de cotización)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lineas_cotizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  catalogo_id uuid REFERENCES public.catalogos(id) ON DELETE SET NULL,
  
  -- SNAPSHOT: Valores congelados en el momento de la cotización
  nombre_personalizado text NOT NULL,
  nombre_snapshot text,
  precio_unitario_aplicado numeric(12,2) NOT NULL DEFAULT 0,
  descuento numeric(12,2) NOT NULL DEFAULT 0,
  subtotal_linea numeric(12,2) NOT NULL DEFAULT 0,
  
  -- IMPUESTOS POR LÍNEA
  incluye_iva boolean NOT NULL DEFAULT true,
  incluye_isr boolean NOT NULL DEFAULT false,
  
  -- DATOS ADICIONALES
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad >= 1),
  categoria text DEFAULT '',
  unidad text DEFAULT 'pz',
  notas_item text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  
  -- AUDITORÍA
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lineas_cotizacion_cotizacion ON public.lineas_cotizacion(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_lineas_cotizacion_sort ON public.lineas_cotizacion(cotizacion_id, sort_order);

-- ============================================================================
-- SECCIÓN 3: FUNCIONES DE CÁLCULO
-- ============================================================================

-- Función para calcular subtotal de línea
CREATE OR REPLACE FUNCTION public.calcular_subtotal_linea()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.subtotal_linea := (NEW.precio_unitario_aplicado * NEW.cantidad) - NEW.descuento;
  
  -- Copiar nombre_snapshot si no está establecido
  IF NEW.nombre_snapshot IS NULL THEN
    NEW.nombre_snapshot := NEW.nombre_personalizado;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger para calcular subtotal
DROP TRIGGER IF EXISTS trigger_calcular_subtotal_linea ON public.lineas_cotizacion;
CREATE TRIGGER trigger_calcular_subtotal_linea
  BEFORE INSERT OR UPDATE OF precio_unitario_aplicado, descuento, cantidad ON public.lineas_cotizacion
  FOR EACH ROW EXECUTE FUNCTION public.calcular_subtotal_linea();

-- Función para recalcular totales de cotización
CREATE OR REPLACE FUNCTION public.recalcular_totales_cotizacion(p_cotizacion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub numeric := 0;
  v_iva_total numeric := 0;
  v_isr_total numeric := 0;
  v_total numeric := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      lc.subtotal_linea,
      lc.incluye_iva,
      lc.incluye_isr
    FROM public.lineas_cotizacion lc
    JOIN public.cotizaciones c ON lc.cotizacion_id = c.id
    WHERE lc.cotizacion_id = p_cotizacion_id
      AND c.tenant_id = public.get_tenant_id()
  LOOP
    v_sub := v_sub + rec.subtotal_linea;
    
    IF rec.incluye_iva THEN
      v_iva_total := v_iva_total + (rec.subtotal_linea * 0.16);
    END IF;
    
    IF rec.incluye_isr THEN
      v_isr_total := v_isr_total + (rec.subtotal_linea * 0.0125);
    END IF;
  END LOOP;
  
  v_total := v_sub + v_iva_total - v_isr_total;
  
  UPDATE public.cotizaciones
  SET
    subtotal = COALESCE(v_sub, 0),
    total = COALESCE(v_total, 0),
    saldo = COALESCE(v_total, 0) - anticipo,
    updated_at = now()
  WHERE id = p_cotizacion_id;
END;
$$;

-- Trigger para refrescar totales después de cambios en líneas
DROP TRIGGER IF EXISTS trigger_refresh_cotizacion_totals ON public.lineas_cotizacion;
CREATE TRIGGER trigger_refresh_cotizacion_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.lineas_cotizacion
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_totales_cotizacion(NEW.cotizacion_id);

-- ============================================================================
-- SECCIÓN 4: FUNCIÓN RPC PARA GUARDAR COTIZACIÓN COMPLETA (UPSERT)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.save_cotizacion_with_items(
  p_evento_id text,
  p_tenant_id text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cotizacion_id uuid;
  v_existing_count integer;
  v_item jsonb;
BEGIN
  -- Verificar si existe cotización en borrador para este evento
  SELECT COUNT(*), COALESCE(MAX(id), NULL) INTO v_existing_count, v_cotizacion_id
  FROM public.cotizaciones
  WHERE evento_id = p_evento_id AND tenant_id = p_tenant_id AND estado = 'borrador';
  
  IF v_existing_count = 0 THEN
    -- Crear nueva cotización
    INSERT INTO public.cotizaciones (
      evento_id, tenant_id, estado, subtotal, total, anticipo, saldo, notas
    ) VALUES (
      p_evento_id, p_tenant_id, 'borrador', 0, 0, 0, 0, ''
    )
    RETURNING id INTO v_cotizacion_id;
  END IF;
  
  -- Limpiar líneas existentes
  DELETE FROM public.lineas_cotizacion WHERE cotizacion_id = v_cotizacion_id;
  
  -- Insertar nuevas líneas
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.lineas_cotizacion (
      cotizacion_id,
      catalogo_id,
      nombre_personalizado,
      nombre_snapshot,
      precio_unitario_aplicado,
      descuento,
      cantidad,
      categoria,
      unidad,
      incluye_iva,
      incluye_isr,
      sort_order,
      notas_item
    ) VALUES (
      v_cotizacion_id,
      NULLIF(v_item->>'catalogo_id', '')::uuid,
      COALESCE(v_item->>'nombre_personalizado', v_item->>'nombre', 'Item sin nombre'),
      COALESCE(v_item->>'nombre_snapshot', v_item->>'nombre', 'Item sin nombre'),
      COALESCE((v_item->>'precio_unitario_aplicado')::numeric, 0),
      COALESCE((v_item->>'descuento')::numeric, 0),
      COALESCE((v_item->>'cantidad')::integer, 1),
      COALESCE(v_item->>'categoria', ''),
      COALESCE(v_item->>'unidad', 'pz'),
      COALESCE((v_item->>'incluye_iva')::boolean, true),
      COALESCE((v_item->>'incluye_isr')::boolean, false),
      COALESCE((v_item->>'sort_order')::integer, 0),
      COALESCE(v_item->>'notas_item', '')
    );
  END LOOP;
  
  -- Recalcular totales
  PERFORM public.recalcular_totales_cotizacion(v_cotizacion_id);
  
  RETURN v_cotizacion_id;
END;
$$;

-- ============================================================================
-- SECCIÓN 5: POLÍTICAS RLS PARA lineas_cotizacion
-- ============================================================================

ALTER TABLE public.lineas_cotizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_lineas_cotizacion_user ON public.lineas_cotizacion FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cotizaciones c
    WHERE c.id = lineas_cotizacion.cotizacion_id
      AND c.tenant_id = public.get_tenant_id()
      AND public.user_can_read()
  ));

CREATE POLICY manage_lineas_cotizacion_user ON public.lineas_cotizacion FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.cotizaciones c
    WHERE c.id = lineas_cotizacion.cotizacion_id
      AND c.tenant_id = public.get_tenant_id()
      AND public.user_can_write()
  ));

-- ============================================================================
-- SECCIÓN 6: FUNCIÓN PARA OBTENER CONFIGURACIÓN FISCAL DE EMPRESA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_empresa_tax_defaults(p_empresa_id text)
RETURNS TABLE (iva_default numeric, isr_default numeric)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(e.iva_default, 16.00)::numeric AS iva_default,
    COALESCE(e.isr_default, 1.25)::numeric AS isr_default
  FROM public.empresas e
  WHERE e.id = p_empresa_id;
END;
$$;

-- ============================================================================
-- SECCIÓN 7: TRIGGER PARA updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_lineas_cotizacion_updated_at ON public.lineas_cotizacion;
CREATE TRIGGER trigger_lineas_cotizacion_updated_at
  BEFORE UPDATE ON public.lineas_cotizacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- NOTAS DE MIGRACIÓN
-- ============================================================================
-- 
-- ANTES DE EJECUTAR ESTE SCRIPT:
-- 1. Si existe la tabla quote_items, migrar datos manualmente:
--    INSERT INTO lineas_cotizacion (id, cotizacion_id, catalogo_id, nombre_personalizado, ...)
--    SELECT id, cotizacion_id, catalog_item_id, name, ... FROM quote_items;
--
-- 2. Eliminar la tabla antigua después de migrar:
--    DROP TABLE IF EXISTS public.quote_items;
--
-- 3. Actualizar políticas RLS existentes que referencien quote_items
-- ============================================================================
