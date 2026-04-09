-- ============================================================================
-- AUREA — Hito 5: Smart Quote Engine Persistence
-- ============================================================================
-- Migration: Add IVA/ISR configuration and snapshot fields
-- ============================================================================

-- 1. Add iva_default and isr_default to empresas table
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS iva_default numeric(5,2) DEFAULT 16.00,
ADD COLUMN IF NOT EXISTS isr_default numeric(5,2) DEFAULT 1.25;

COMMENT ON COLUMN public.empresas.iva_default IS 'Porcentaje de IVA por defecto para cotizaciones (ej: 16.00)';
COMMENT ON COLUMN public.empresas.isr_default IS 'Porcentaje de ISR retención por defecto para cotizaciones (ej: 1.25)';

-- 2. Add snapshot and tax fields to quote_items table
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS nombre_snapshot text,
ADD COLUMN IF NOT EXISTS incluye_iva boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS incluye_isr boolean DEFAULT true;

COMMENT ON COLUMN public.quote_items.nombre_snapshot IS 'Nombre del producto copiado en el momento de la cotización';
COMMENT ON COLUMN public.quote_items.incluye_iva IS 'Indica si este item incluye IVA en el cálculo';
COMMENT ON COLUMN public.quote_items.incluye_isr IS 'Indica si este item aplica retención ISR';

-- 3. Update calculate_quote_item_totals to respect IVA/ISR flags
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
  
  -- Copy nombre_snapshot if not set
  IF NEW.nombre_snapshot IS NULL THEN
    NEW.nombre_snapshot := NEW.name;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 4. Update refresh_quote_totals to handle per-item IVA/ISR
CREATE OR REPLACE FUNCTION public.refresh_quote_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub numeric := 0;
  v_disc numeric := 0;
  v_iva_total numeric := 0;
  v_isr_total numeric := 0;
  v_tot numeric := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      qi.unit_price * qi.quantity AS original,
      CASE
        WHEN qi.discount_type = 'percentage' THEN (qi.unit_price * qi.quantity * qi.discount_value / 100)
        WHEN qi.discount_type = 'fixed' THEN qi.discount_value
        WHEN qi.discount_type = 'package' THEN (qi.unit_price * qi.quantity) - qi.line_total
        ELSE 0
      END AS discount,
      qi.line_total AS line_total,
      qi.incluye_iva,
      qi.incluye_isr
    FROM public.quote_items qi
    JOIN public.cotizaciones c ON qi.cotizacion_id = c.id
    WHERE qi.cotizacion_id = NEW.cotizacion_id
      AND qi.stock_status != 'out_of_stock'
      AND c.tenant_id = public.get_tenant_id()
  LOOP
    v_sub := v_sub + rec.original;
    v_disc := v_disc + rec.discount;
    
    -- Calculate taxes per line item
    IF rec.incluye_iva THEN
      v_iva_total := v_iva_total + (rec.line_total * 0.16); -- IVA 16%
    END IF;
    
    IF rec.incluye_isr THEN
      v_isr_total := v_isr_total + (rec.line_total * 0.0125); -- ISR 1.25%
    END IF;
  END LOOP;
  
  v_tot := v_sub - v_disc + v_iva_total - v_isr_total;
  
  UPDATE public.cotizaciones
  SET
    subtotal = COALESCE(v_sub, 0),
    discount_total = COALESCE(v_disc, 0),
    total = COALESCE(v_tot, 0),
    saldo = COALESCE(v_tot, 0) - anticipo,
    updated_at = now()
  WHERE id = NEW.cotizacion_id;
  
  RETURN NEW;
END;
$$;

-- 5. Create function to get empresa tax defaults
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

-- 6. Create function to save/update cotizacion with items (upsert)
CREATE OR REPLACE FUNCTION public.save_cotizacion_with_items(
  p_evento_id text,
  p_tenant_id text,
  p_items jsonb,
  p_iva_default numeric DEFAULT 16.00,
  p_isr_default numeric DEFAULT 1.25
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cotizacion_id uuid;
  v_existing_count integer;
  v_item jsonb;
  v_item_id uuid;
BEGIN
  -- Check if cotizacion exists for this evento
  SELECT COUNT(*), COALESCE(MAX(id), NULL) INTO v_existing_count, v_cotizacion_id
  FROM public.cotizaciones
  WHERE evento_id = p_evento_id AND tenant_id = p_tenant_id AND status = 'draft';
  
  IF v_existing_count = 0 THEN
    -- Create new cotizacion
    INSERT INTO public.cotizaciones (
      evento_id, tenant_id, status, subtotal, discount_total, total,
      anticipo, saldo, notes
    ) VALUES (
      p_evento_id, p_tenant_id, 'draft', 0, 0, 0, 0, 0, ''
    )
    RETURNING id INTO v_cotizacion_id;
  END IF;
  
  -- Clear existing items
  DELETE FROM public.quote_items WHERE cotizacion_id = v_cotizacion_id;
  
  -- Insert new items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.quote_items (
      cotizacion_id,
      catalog_item_id,
      name,
      nombre_snapshot,
      category,
      description,
      unit,
      unit_price,
      discount_type,
      discount_value,
      quantity,
      incluye_iva,
      incluye_isr,
      sort_order,
      notes
    ) VALUES (
      v_cotizacion_id,
      (v_item->>'catalog_item_id')::text,
      v_item->>'name',
      COALESCE(v_item->>'nombre_snapshot', v_item->>'name'),
      COALESCE(v_item->>'category', ''),
      COALESCE(v_item->>'description', ''),
      COALESCE(v_item->>'unit', 'pz'),
      (v_item->>'unit_price')::numeric,
      COALESCE(v_item->>'discount_type', 'none'),
      COALESCE((v_item->>'discount_value')::numeric, 0),
      COALESCE((v_item->>'quantity')::integer, 1),
      COALESCE((v_item->>'incluye_iva')::boolean, true),
      COALESCE((v_item->>'incluye_isr')::boolean, true),
      COALESCE((v_item->>'sort_order')::integer, 0),
      COALESCE(v_item->>'notes', '')
    );
  END LOOP;
  
  RETURN v_cotizacion_id;
END;
$$;

-- 7. RLS policy for empresas (read tax defaults)
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_empresas_tax_defaults ON public.empresas FOR SELECT
  USING (true);

-- ============================================================================
-- Seed: Update existing empresa with defaults (run manually if needed)
-- ============================================================================
-- UPDATE public.empresas SET iva_default = 16.00, isr_default = 1.25 WHERE iva_default IS NULL;
