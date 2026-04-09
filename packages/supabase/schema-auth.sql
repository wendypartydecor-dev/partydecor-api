-- ============================================================================
-- AUREA — Schema de Autenticación y Multi-tenancy
-- ============================================================================
-- Ingeniero de Lógica: DeepSeek
-- Corrección: OpenCode
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: VISTA v_usuarios_empresas (Corregida)
-- ============================================================================

DROP VIEW IF EXISTS public.v_usuarios_empresas CASCADE;

CREATE VIEW public.v_usuarios_empresas AS
SELECT
  ue.id_usuario AS usuario_id,
  ue.id_empresa AS empresa_id,
  ue.rol,
  ue.activo,
  u.nombre AS usuario_nombre,
  e.nombre AS empresa_nombre,
  e.nombre_corto AS empresa_nombre_corto,
  e.logo_header_url AS empresa_logo
FROM public.usuario_empresa ue
JOIN public.usuarios u ON ue.id_usuario = u.id
JOIN public.empresas e ON ue.id_empresa = e.id
WHERE ue.activo = true;

-- ============================================================================
-- SECCIÓN 2: ÍNDICES DE RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_usuario_empresa_id_usuario_activo 
  ON public.usuario_empresa(id_usuario, activo);

CREATE INDEX IF NOT EXISTS idx_usuario_empresa_id_empresa 
  ON public.usuario_empresa(id_empresa);

-- ============================================================================
-- SECCIÓN 3: FUNCIONES AUXILIARES DE AUTENTICACIÓN
-- ============================================================================

-- Obtiene el tenant activo del usuario (SECURITY DEFINER para acceso sin RLS activo)
CREATE OR REPLACE FUNCTION public.get_user_tenant(user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id text;
BEGIN
  SELECT id_empresa INTO v_tenant_id
  FROM public.usuario_empresa
  WHERE id_usuario = user_id
    AND activo = true
  LIMIT 1;
  
  RETURN v_tenant_id;
END;
$$;

-- Obtiene todas las empresas del usuario (para Company Selector)
CREATE OR REPLACE FUNCTION public.get_user_tenants(user_id uuid)
RETURNS TABLE (
  empresa_id text,
  empresa_nombre text,
  empresa_nombre_corto text,
  empresa_logo text,
  rol text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nombre,
    e.nombre_corto,
    e.logo_header_url,
    ue.rol
  FROM public.usuario_empresa ue
  JOIN public.empresas e ON ue.id_empresa = e.id
  WHERE ue.id_usuario = user_id
    AND ue.activo = true;
END;
$$;

-- Obtiene el conteo de empresas del usuario
CREATE OR REPLACE FUNCTION public.count_user_tenants(user_id uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.usuario_empresa
  WHERE id_usuario = user_id
    AND activo = true;
  
  RETURN v_count;
END;
$$;

-- ============================================================================
-- SECCIÓN 4: RLS PARA usuario_empresa
-- ============================================================================

ALTER TABLE public.usuario_empresa ENABLE ROW LEVEL SECURITY;

-- Permitir que usuarios autenticados vean sus propias relaciones
DROP POLICY IF EXISTS select_self ON public.usuario_empresa;
CREATE POLICY select_self ON public.usuario_empresa FOR SELECT
  USING (id_usuario = auth.uid());

-- Permitir admins del tenant gestionar relaciones del tenant
DROP POLICY IF EXISTS manage_tenant ON public.usuario_empresa;
CREATE POLICY manage_tenant ON public.usuario_empresa FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuario_empresa ue_admin
      WHERE ue_admin.id_usuario = auth.uid()
        AND ue_admin.id_empresa = usuario_empresa.id_empresa
        AND ue_admin.rol = 'admin'
        AND ue_admin.activo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuario_empresa ue_admin
      WHERE ue_admin.id_usuario = auth.uid()
        AND ue_admin.id_empresa = usuario_empresa.id_empresa
        AND ue_admin.rol = 'admin'
        AND ue_admin.activo = true
    )
  );

-- ============================================================================
-- SECCIÓN 5: CONFIGURACIÓN DE HOOK DE AUTH (para Supabase Dashboard)
-- ============================================================================

-- Esta función se ejecuta después de cada autenticación exitosa
-- Debe configurarse como "Post Authentication Hook" en Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/{ref}/auth/hooks

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Opcional: crear registro en public.usuarios si no existe
  -- (Supabase Auth ya crea en auth.users, esto es para public.usuarios)
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- El trigger se ejecuta post-auth, el JWT ya tiene el usuario
    NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- SECCIÓN 6: FUNCIÓN DE AUTENTICACIÓN POR PIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.authenticate_with_pin(
  user_email text,
  user_pin text
)
RETURNS TABLE (
  user_id uuid,
  empresa_id text,
  rol text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    ue.id_empresa AS empresa_id,
    ue.rol::text
  FROM public.usuarios u
  INNER JOIN public.usuario_empresa ue ON u.id = ue.id_usuario
  WHERE u.email = user_email
    AND u.pin_hash = crypt(user_pin, u.pin_hash)
    AND u.activo = true
    AND ue.activo = true
  LIMIT 1;
END;
$$;

-- ============================================================================
-- SECCIÓN 7: VERIFICACIÓN POST-CORRECCIÓN
-- ============================================================================

-- Para verificar en SQL:
-- SELECT * FROM public.v_usuarios_empresas LIMIT 1;
-- SELECT public.count_user_tenants('tu-uuid-aqui');
-- SELECT * FROM public.get_user_tenants('tu-uuid-aqui');
-- SELECT * FROM public.authenticate_with_pin('email@test.com', '1234');
