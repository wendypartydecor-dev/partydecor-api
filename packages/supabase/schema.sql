-- ============================================================================
-- AUREA — Schema de Base de Datos para Hito 1: Workspace Shell & Plugin System
-- ============================================================================
-- Ingeniero de Lógica: DeepSeek
-- Validación: Gemini
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: TABLAS DE PLUGINS
-- ============================================================================

-- Catálogo global de plugins (mantenido por Aurea)
CREATE TABLE IF NOT EXISTS public.plugins (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  version text NOT NULL,
  aurea_version text NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}',
  settings_schema jsonb,
  is_official boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Plugins instalados por tenant (empresa)
CREATE TABLE IF NOT EXISTS public.plugin_instalaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id text NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  version text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  permissions_granted text[] NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plugin_id, tenant_id)
);

-- Almacenamiento aislado por plugin y tenant
CREATE TABLE IF NOT EXISTS public.plugin_storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_instalacion_id uuid NOT NULL REFERENCES public.plugin_instalaciones(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plugin_instalacion_id, key)
);

-- ============================================================================
-- SECCIÓN 2: MIGRACIÓN — Cambio de bigint a uuid en usuarios
-- ============================================================================
-- NOTA: Descomentar y ejecutar en migración planificada
-- ALTER TABLE public.usuarios ALTER COLUMN id TYPE uuid USING gen_random_uuid();
-- ALTER TABLE public.usuario_empresa ALTER COLUMN id_usuario TYPE uuid;

-- ============================================================================
-- SECCIÓN 3: ÍNDICES COMPUESTOS PARA ESTADOS SEMÁNTICOS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_eventos_tenant_fecha ON public.eventos(id_empresa, f_ev);
CREATE INDEX IF NOT EXISTS idx_eventos_tenant_saldo ON public.eventos(id_empresa, saldo);
CREATE INDEX IF NOT EXISTS idx_eventos_tenant_estado ON public.eventos(id_empresa, estado);
CREATE INDEX IF NOT EXISTS idx_plugin_storage_instalacion ON public.plugin_storage(plugin_instalacion_id);

-- ============================================================================
-- SECCIÓN 4: FUNCIONES AUXILIARES DE SEGURIDAD (RLS)
-- ============================================================================

-- Verifica que el usuario autenticado pertenece al tenant y tiene un rol activo
CREATE OR REPLACE FUNCTION public.user_can_read()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    JOIN public.usuarios u ON ue.id_usuario = u.id
    WHERE ue.id_usuario = auth.uid()
      AND ue.id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
      AND ue.activo = true
  );
END;
$$;

-- Verifica que el usuario tiene permisos de escritura (admin o empleado)
CREATE OR REPLACE FUNCTION public.user_can_write()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    JOIN public.usuarios u ON ue.id_usuario = u.id
    WHERE ue.id_usuario = auth.uid()
      AND ue.id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
      AND ue.activo = true
      AND ue.rol IN ('admin', 'empleado')
  );
END;
$$;

-- Verifica que el usuario es admin del tenant
CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    WHERE ue.id_usuario = auth.uid()
      AND ue.id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
      AND ue.activo = true
      AND ue.rol = 'admin'
  );
END;
$$;

-- Verifica que el plugin tiene el permiso requerido y está habilitado en el tenant
CREATE OR REPLACE FUNCTION public.check_plugin_permission(required_permission text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plugin_id text;
  v_tenant_id text;
BEGIN
  v_plugin_id := current_setting('request.jwt.claims', true)::jsonb->>'plugin_id';
  v_tenant_id := current_setting('request.jwt.claims', true)::jsonb->>'tenant_id';

  IF v_plugin_id IS NULL OR v_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.plugin_instalaciones pi
    WHERE pi.plugin_id = v_plugin_id
      AND pi.tenant_id = v_tenant_id
      AND pi.enabled = true
      AND required_permission = ANY(pi.permissions_granted)
  );
END;
$$;

-- Función para calcular estado semántico de un evento
CREATE OR REPLACE FUNCTION public.get_evento_semantic_status(p_evento_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_fecha date;
  v_saldo numeric;
  v_dias integer;
BEGIN
  SELECT e.f_ev, e.saldo INTO v_fecha, v_saldo
  FROM public.eventos e
  WHERE e.id = p_evento_id;

  IF v_fecha IS NULL THEN
    RETURN 'unknown';
  END IF;

  v_dias := CURRENT_DATE - v_fecha;

  -- Prioridad de estados (de mayor a menor)
  IF v_dias <= 1 THEN
    RETURN 'urgent';           -- evento hoy o ayer
  END IF;
  IF v_dias < 0 AND v_saldo > 0 THEN
    RETURN 'overdue';          -- evento pasado con saldo
  END IF;
  IF v_saldo > 0 THEN
    RETURN 'pending';          -- saldo sin pagar (futuro)
  END IF;
  IF v_dias <= 7 THEN
    RETURN 'upcoming';         -- próximo 3-7 días
  END IF;
  IF v_dias < 0 THEN
    RETURN 'past';             -- sin pendientes
  END IF;
  RETURN 'confirmed';          -- todo ok
END;
$$;

-- ============================================================================
-- SECCIÓN 5: POLÍTICAS RLS
-- ============================================================================

-- Habilitar RLS en tablas de plugins
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_storage ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tablas core (si no están ya habilitadas)
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_cotizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_precios ENABLE ROW LEVEL SECURITY;

-- ----- PLUGINS (catálogo global) -----
CREATE POLICY select_plugins_public ON public.plugins FOR SELECT USING (true);

-- ----- PLUGIN_INSTALACIONES -----
CREATE POLICY select_plugin_instalaciones_user ON public.plugin_instalaciones FOR SELECT
  USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_read());

CREATE POLICY insert_plugin_instalaciones_admin ON public.plugin_instalaciones FOR INSERT
  WITH CHECK (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
              AND public.user_is_admin());

CREATE POLICY update_plugin_instalaciones_admin ON public.plugin_instalaciones FOR UPDATE
  USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_is_admin())
  WITH CHECK (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY delete_plugin_instalaciones_admin ON public.plugin_instalaciones FOR DELETE
  USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_is_admin());

-- ----- PLUGIN_STORAGE (aislamiento total por plugin_id + tenant_id) -----
CREATE POLICY select_plugin_storage ON public.plugin_storage FOR SELECT
  USING (plugin_instalacion_id IN (
    SELECT pi.id FROM public.plugin_instalaciones pi
    WHERE pi.plugin_id = current_setting('request.jwt.claims', true)::jsonb->>'plugin_id'
      AND pi.tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
      AND pi.enabled = true
  ));

CREATE POLICY insert_plugin_storage ON public.plugin_storage FOR INSERT
  WITH CHECK (plugin_instalacion_id IN (
    SELECT pi.id FROM public.plugin_instalaciones pi
    WHERE pi.plugin_id = current_setting('request.jwt.claims', true)::jsonb->>'plugin_id'
      AND pi.tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
      AND pi.enabled = true
  ));

CREATE POLICY update_plugin_storage ON public.plugin_storage FOR UPDATE
  USING (plugin_instalacion_id IN (
    SELECT pi.id FROM public.plugin_instalaciones pi
    WHERE pi.plugin_id = current_setting('request.jwt.claims', true)::jsonb->>'plugin_id'
      AND pi.tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
      AND pi.enabled = true
  ));

CREATE POLICY delete_plugin_storage ON public.plugin_storage FOR DELETE
  USING (plugin_instalacion_id IN (
    SELECT pi.id FROM public.plugin_instalaciones pi
    WHERE pi.plugin_id = current_setting('request.jwt.claims', true)::jsonb->>'plugin_id'
      AND pi.tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
      AND pi.enabled = true
  ));

-- ----- EVENTOS (core tables) -----
-- Usuarios: lectura
CREATE POLICY select_eventos_user ON public.eventos FOR SELECT
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_read());

-- Usuarios: escritura
CREATE POLICY insert_eventos_user ON public.eventos FOR INSERT
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
              AND public.user_can_write());

CREATE POLICY update_eventos_user ON public.eventos FOR UPDATE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write())
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY delete_eventos_user ON public.eventos FOR DELETE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write());

-- Plugins: lectura con permiso
CREATE POLICY select_eventos_plugin ON public.eventos FOR SELECT
  USING (public.check_plugin_permission('eventos:read')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

-- Plugins: escritura con permiso
CREATE POLICY insert_eventos_plugin ON public.eventos FOR INSERT
  WITH CHECK (public.check_plugin_permission('eventos:write')
              AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY update_eventos_plugin ON public.eventos FOR UPDATE
  USING (public.check_plugin_permission('eventos:write')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY delete_eventos_plugin ON public.eventos FOR DELETE
  USING (public.check_plugin_permission('eventos:write')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

-- ----- CLIENTES (core tables) -----
CREATE POLICY select_clientes_user ON public.clientes FOR SELECT
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_read());

CREATE POLICY insert_clientes_user ON public.clientes FOR INSERT
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
              AND public.user_can_write());

CREATE POLICY update_clientes_user ON public.clientes FOR UPDATE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write())
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY delete_clientes_user ON public.clientes FOR DELETE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write());

-- Plugins: clientes
CREATE POLICY select_clientes_plugin ON public.clientes FOR SELECT
  USING (public.check_plugin_permission('clientes:read')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY insert_clientes_plugin ON public.clientes FOR INSERT
  WITH CHECK (public.check_plugin_permission('clientes:write')
              AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY update_clientes_plugin ON public.clientes FOR UPDATE
  USING (public.check_plugin_permission('clientes:write')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

-- ----- DETALLE_COTIZACION -----
CREATE POLICY select_detalle_cotizacion_user ON public.detalle_cotizacion FOR SELECT
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_read());

CREATE POLICY insert_detalle_cotizacion_user ON public.detalle_cotizacion FOR INSERT
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
              AND public.user_can_write());

CREATE POLICY update_detalle_cotizacion_user ON public.detalle_cotizacion FOR UPDATE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write())
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY delete_detalle_cotizacion_user ON public.detalle_cotizacion FOR DELETE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write());

-- Plugins: cotizaciones
CREATE POLICY select_detalle_cotizacion_plugin ON public.detalle_cotizacion FOR SELECT
  USING (public.check_plugin_permission('cotizaciones:read')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY insert_detalle_cotizacion_plugin ON public.detalle_cotizacion FOR INSERT
  WITH CHECK (public.check_plugin_permission('cotizaciones:write')
              AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY update_detalle_cotizacion_plugin ON public.detalle_cotizacion FOR UPDATE
  USING (public.check_plugin_permission('cotizaciones:write')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY delete_detalle_cotizacion_plugin ON public.detalle_cotizacion FOR DELETE
  USING (public.check_plugin_permission('cotizaciones:write')
         AND id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

-- ----- CATALOGO_PRECIOS -----
CREATE POLICY select_catalogo_precios_user ON public.catalogo_precios FOR SELECT
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_read());

CREATE POLICY insert_catalogo_precios_user ON public.catalogo_precios FOR INSERT
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
              AND public.user_can_write());

CREATE POLICY update_catalogo_precios_user ON public.catalogo_precios FOR UPDATE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write())
  WITH CHECK (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

CREATE POLICY delete_catalogo_precios_user ON public.catalogo_precios FOR DELETE
  USING (id_empresa = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'
         AND public.user_can_write());

-- ============================================================================
-- SECCIÓN 6: TRIGGERS PARA updated_at AUTOMÁTICO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar trigger a todas las tablas con updated_at
CREATE OR REPLACE TRIGGER trigger_plugins_updated_at
  BEFORE UPDATE ON public.plugins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_plugin_instalaciones_updated_at
  BEFORE UPDATE ON public.plugin_instalaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_plugin_storage_updated_at
  BEFORE UPDATE ON public.plugin_storage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_detalle_cotizacion_updated_at
  BEFORE UPDATE ON public.detalle_cotizacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_catalogo_precios_updated_at
  BEFORE UPDATE ON public.catalogo_precios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECCIÓN 7: SEED DATA — Plugin oficial de Catálogo
-- ============================================================================

INSERT INTO public.plugins (id, name, description, version, aurea_version, permissions, is_official)
VALUES (
  'com.aurea.catalogo',
  'Catálogo e Inventario',
  'Gestión de catálogo de precios e inventario para decoradores de eventos',
  '1.0.0',
  '^2.0.0',
  ARRAY['eventos:read', 'cotizaciones:read', 'storage:own'],
  true
) ON CONFLICT (id) DO NOTHING;
