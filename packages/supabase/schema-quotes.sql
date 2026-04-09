-- ============================================================================
-- AUREA — Schema Hito 2: Smart Quote Engine
-- ============================================================================

-- ============================================================================
-- SECCIÓN 8: TABLAS DE COTIZACIONES (Hito 2)
-- ============================================================================

-- Tabla de versiones de cotización
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id text NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada', 'superada')),
  subtotal numeric NOT NULL DEFAULT 0,
  discount_total numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  anticipo numeric NOT NULL DEFAULT 0,
  saldo numeric NOT NULL DEFAULT 0,
  notas text DEFAULT '',
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.usuarios(id),
  tenant_id text NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  UNIQUE(evento_id, version)
);

-- Líneas de detalle de cotización
CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  catalog_item_id text REFERENCES public.catalogo_precios(id),
  name text NOT NULL,
  name_original text,
  category text NOT NULL DEFAULT '',
  description text DEFAULT '',
  unit text NOT NULL DEFAULT 'pz',
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  discount_type text NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed', 'package')),
  discount_value numeric NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  unit_price_effective numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  line_total_original numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  stock_status text NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'low', 'out_of_stock', 'on_demand')),
  stock_quantity_available integer NOT NULL DEFAULT 0,
  requires_approval boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT line_totals_check CHECK (line_total_original = unit_price * quantity),
  CONSTRAINT unit_price_effective_positive CHECK (unit_price_effective >= 0)
);

-- Control de acceso por vendedor
CREATE TABLE IF NOT EXISTS public.evento_asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id text NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evento_id, usuario_id)
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_cotizaciones_evento ON public.cotizaciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_tenant_estado ON public.cotizaciones(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_quote_items_cotizacion ON public.quote_items(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_sort ON public.quote_items(cotizacion_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_evento_asignaciones_usuario ON public.evento_asignaciones(usuario_id);

-- ============================================================================
-- SECCIÓN 9: FUNCIONES DE CÁLCULO
-- ============================================================================

-- Función auxiliar para obtener tenant_id del JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::jsonb->>'tenant_id';
END;
$$;

-- Función para calcular totales de cotización
CREATE OR REPLACE FUNCTION public.compute_quote_totals(p_cotizacion_id uuid)
RETURNS TABLE (subtotal numeric, discount_total numeric, total numeric)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rec RECORD;
  v_sub numeric := 0;
  v_disc numeric := 0;
  v_tot numeric := 0;
BEGIN
  FOR rec IN
    SELECT
      qi.unit_price * qi.quantity AS original,
      CASE
        WHEN qi.discount_type = 'percentage' THEN (qi.unit_price * qi.quantity * qi.discount_value / 100)
        WHEN qi.discount_type = 'fixed' THEN qi.discount_value
        WHEN qi.discount_type = 'package' THEN (qi.unit_price * qi.quantity) - qi.line_total
        ELSE 0
      END AS discount
    FROM public.quote_items qi
    JOIN public.cotizaciones c ON qi.cotizacion_id = c.id
    WHERE qi.cotizacion_id = p_cotizacion_id
      AND qi.stock_status != 'out_of_stock'
      AND c.tenant_id = public.get_tenant_id()
  LOOP
    v_sub := v_sub + rec.original;
    v_disc := v_disc + rec.discount;
  END LOOP;
  v_tot := v_sub - v_disc;
  RETURN QUERY SELECT v_sub, v_disc, v_tot;
END;
$$;

-- Función para recalcular totales al modificar items
CREATE OR REPLACE FUNCTION public.refresh_quote_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  totals RECORD;
BEGIN
  SELECT * INTO totals FROM public.compute_quote_totals(NEW.cotizacion_id);
  
  UPDATE public.cotizaciones
  SET
    subtotal = COALESCE(totals.subtotal, 0),
    discount_total = COALESCE(totals.discount_total, 0),
    total = COALESCE(totals.total, 0),
    saldo = COALESCE(totals.total, 0) - anticipo,
    updated_at = now()
  WHERE id = NEW.cotizacion_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para recalcular totales
DROP TRIGGER IF EXISTS trigger_refresh_quote_totals ON public.quote_items;
CREATE TRIGGER trigger_refresh_quote_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.refresh_quote_totals();

-- Validación de precio vs catálogo
CREATE OR REPLACE FUNCTION public.check_quote_item_price()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  catalog_price numeric;
BEGIN
  IF NEW.catalog_item_id IS NOT NULL THEN
    SELECT precio INTO catalog_price
    FROM public.catalogo_precios
    WHERE id = NEW.catalog_item_id;
    
    IF catalog_price IS NOT NULL AND NEW.unit_price < catalog_price THEN
      NEW.requires_approval := true;
    ELSE
      NEW.requires_approval := false;
    END IF;
  ELSE
    NEW.requires_approval := false;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_quote_item_price ON public.quote_items;
CREATE TRIGGER trigger_check_quote_item_price
  BEFORE INSERT OR UPDATE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.check_quote_item_price();

-- Función para calcular precio efectivo
CREATE OR REPLACE FUNCTION public.calculate_unit_price_effective(
  p_unit_price numeric,
  p_discount_type text,
  p_discount_value numeric
)
RETURNS numeric LANGUAGE plpgsql AS $$
BEGIN
  CASE p_discount_type
    WHEN 'percentage' THEN
      RETURN p_unit_price * (1 - p_discount_value / 100);
    WHEN 'fixed' THEN
      RETURN p_unit_price - p_discount_value;
    WHEN 'package' THEN
      RETURN p_discount_value;
    ELSE
      RETURN p_unit_price;
  END CASE;
END;
$$;

-- Trigger para actualizar precios efectivos y totales
CREATE OR REPLACE FUNCTION public.calculate_quote_item_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.unit_price_effective := public.calculate_unit_price_effective(
    NEW.unit_price,
    NEW.discount_type,
    NEW.discount_value
  );
  NEW.line_total_original := NEW.unit_price * NEW.quantity;
  NEW.line_total := NEW.unit_price_effective * NEW.quantity;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_quote_item_totals ON public.quote_items;
CREATE TRIGGER trigger_calculate_quote_item_totals
  BEFORE INSERT OR UPDATE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_quote_item_totals();

-- Función para emitir nueva versión
CREATE OR REPLACE FUNCTION public.emit_quote(p_cotizacion_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  old_cotizacion RECORD;
  new_id uuid;
  max_version integer;
BEGIN
  SELECT * INTO old_cotizacion FROM public.cotizaciones WHERE id = p_cotizacion_id;
  
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM public.cotizaciones WHERE evento_id = old_cotizacion.evento_id;
  
  UPDATE public.cotizaciones
  SET estado = 'superada', updated_at = now()
  WHERE id = p_cotizacion_id;
  
  INSERT INTO public.cotizaciones (
    evento_id, version, estado, subtotal, discount_total, total,
    anticipo, saldo, notas, valid_until, created_by, tenant_id
  ) VALUES (
    old_cotizacion.evento_id,
    max_version + 1,
    'enviada',
    old_cotizacion.subtotal,
    old_cotizacion.discount_total,
    old_cotizacion.total,
    old_cotizacion.anticipo,
    old_cotizacion.saldo,
    old_cotizacion.notas,
    old_cotizacion.valid_until,
    auth.uid(),
    old_cotizacion.tenant_id
  )
  RETURNING id INTO new_id;
  
  INSERT INTO public.quote_items (
    cotizacion_id, catalog_item_id, name, name_original, category, description, unit,
    unit_price, discount_type, discount_value, unit_price_effective, quantity,
    line_total_original, line_total, stock_status, stock_quantity_available,
    requires_approval, sort_order, notes
  )
  SELECT
    new_id, catalog_item_id, name, name_original, category, description, unit,
    unit_price, discount_type, discount_value, unit_price_effective, quantity,
    line_total_original, line_total, stock_status, stock_quantity_available,
    requires_approval, sort_order, notes
  FROM public.quote_items
  WHERE cotizacion_id = p_cotizacion_id;
  
  RETURN new_id;
END;
$$;

-- Trigger para updated_at en cotizaciones
DROP TRIGGER IF EXISTS trigger_cotizaciones_updated_at ON public.cotizaciones;
CREATE TRIGGER trigger_cotizaciones_updated_at
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECCIÓN 10: POLÍTICAS RLS PARA COTIZACIONES
-- ============================================================================

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_asignaciones ENABLE ROW LEVEL SECURITY;

-- Cotizaciones: lectura para usuarios del tenant
CREATE POLICY select_cotizaciones_user ON public.cotizaciones FOR SELECT
  USING (tenant_id = public.get_tenant_id() AND public.user_can_read());

CREATE POLICY manage_cotizaciones_user ON public.cotizaciones FOR ALL
  USING (
    tenant_id = public.get_tenant_id()
    AND (
      public.user_is_admin()
      OR (
        public.user_can_write()
        AND EXISTS (
          SELECT 1 FROM public.evento_asignaciones ea
          WHERE ea.evento_id = cotizaciones.evento_id
            AND ea.usuario_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY select_cotizaciones_plugin ON public.cotizaciones FOR SELECT
  USING (public.check_plugin_permission('cotizaciones:read') AND tenant_id = public.get_tenant_id());

CREATE POLICY manage_cotizaciones_plugin ON public.cotizaciones FOR ALL
  USING (public.check_plugin_permission('cotizaciones:write') AND tenant_id = public.get_tenant_id());

-- Quote Items: heredan acceso de cotización padre
CREATE POLICY select_quote_items_user ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cotizaciones c
    WHERE c.id = quote_items.cotizacion_id
      AND c.tenant_id = public.get_tenant_id()
      AND public.user_can_read()
  ));

CREATE POLICY manage_quote_items_user ON public.quote_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.cotizaciones c
    WHERE c.id = quote_items.cotizacion_id
      AND c.tenant_id = public.get_tenant_id()
      AND (
        public.user_is_admin()
        OR (
          public.user_can_write()
          AND EXISTS (
            SELECT 1 FROM public.evento_asignaciones ea
            WHERE ea.evento_id = c.evento_id
              AND ea.usuario_id = auth.uid()
          )
        )
      )
  ));

CREATE POLICY select_quote_items_plugin ON public.quote_items FOR SELECT
  USING (public.check_plugin_permission('cotizaciones:read') AND EXISTS (
    SELECT 1 FROM public.cotizaciones c
    WHERE c.id = quote_items.cotizacion_id
      AND c.tenant_id = public.get_tenant_id()
  ));

CREATE POLICY manage_quote_items_plugin ON public.quote_items FOR ALL
  USING (public.check_plugin_permission('cotizaciones:write') AND EXISTS (
    SELECT 1 FROM public.cotizaciones c
    WHERE c.id = quote_items.cotizacion_id
      AND c.tenant_id = public.get_tenant_id()
  ));

-- Evento Asignaciones: solo admins gestionan, todos ven
CREATE POLICY manage_asignaciones ON public.evento_asignaciones FOR ALL
  USING (public.user_is_admin())
  WITH CHECK (public.user_is_admin());

CREATE POLICY select_asignaciones ON public.evento_asignaciones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.eventos e
    WHERE e.id = evento_asignaciones.evento_id
      AND e.id_empresa = public.get_tenant_id()
  ));
