// src/routes/empresas.js
// ─────────────────────────────────────────────────────────────
//  Rutas de empresas
//
//  GET  /api/empresas/mias          → lista empresas del usuario autenticado
//  GET  /api/empresas/:id/config    → config pública de una empresa (logo, tema)
//  PATCH /api/empresas/:id/logos    → actualizar URLs de logos (solo admin)
// ─────────────────────────────────────────────────────────────
const router   = require('express').Router();
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');


// ─── GET /api/empresas/mias ──────────────────────────────────
// Devuelve todas las empresas a las que tiene acceso el usuario
// autenticado, con su rol en cada una.
//
// Response: [{ id_empresa, empresa, nombre_corto, rol,
//              logo_login_url, logo_header_url, logo_pdf_url,
//              logo_favicon_url, color_primario, tema_default }]
// ─────────────────────────────────────────────────────────────
router.get('/mias', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_usuarios_empresas')
      .select(
        'id_empresa, empresa, nombre_corto, rol, ' +
        'logo_login_url, logo_header_url, logo_pdf_url, ' +
        'logo_favicon_url, color_primario, tema_default'
      )
      .eq('id_usuario', req.user.id);

    if (error) throw error;

    res.json(data || []);
  } catch (e) {
    console.error('GET empresas/mias:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ─── GET /api/empresas/:id/config ────────────────────────────
// Config básica de una empresa: logos, tema, nombre.
// Requiere auth pero NO requiere ser admin — cualquier
// usuario autenticado puede consultar empresas a las que tenga acceso.
// ─────────────────────────────────────────────────────────────
router.get('/:id/config', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario tiene acceso a esta empresa
    const { data: acceso } = await supabase
      .from('usuario_empresa')
      .select('rol')
      .eq('id_usuario', req.user.id)
      .eq('id_empresa', id)
      .eq('activo', true)
      .single();

    if (!acceso) {
      return res.status(403).json({ error: 'Sin acceso a esta empresa' });
    }

    const { data, error } = await supabase
      .from('empresas')
      .select(
        'id, nombre, nombre_corto, ' +
        'logo_login_url, logo_header_url, logo_pdf_url, logo_favicon_url, ' +
        'color_primario, tema_default, telefono, email, sitio_web'
      )
      .eq('id', id)
      .eq('activo', true)
      .single();

    if (error) throw error;
    if (!data)  return res.status(404).json({ error: 'Empresa no encontrada' });

    res.json(data);
  } catch (e) {
    console.error('GET empresa config:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ─── PATCH /api/empresas/:id/logos ───────────────────────────
// Actualiza las URLs de logos de una empresa.
// Solo admin (superadmin o admin de esa empresa).
//
// Body (todos opcionales):
//   { logo_login_url, logo_header_url, logo_pdf_url, logo_favicon_url }
// ─────────────────────────────────────────────────────────────
router.patch('/:id/logos', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que es admin de esta empresa (o superadmin global)
    if (!req.user.es_admin) {
      const { data: acceso } = await supabase
        .from('usuario_empresa')
        .select('rol')
        .eq('id_usuario', req.user.id)
        .eq('id_empresa', id)
        .eq('activo', true)
        .single();

      if (!acceso || acceso.rol !== 'admin') {
        return res.status(403).json({ error: 'Se requiere rol admin en esta empresa' });
      }
    }

    const { logo_login_url, logo_header_url, logo_pdf_url, logo_favicon_url } = req.body;
    const updates = {};
    if (logo_login_url   !== undefined) updates.logo_login_url   = logo_login_url;
    if (logo_header_url  !== undefined) updates.logo_header_url  = logo_header_url;
    if (logo_pdf_url     !== undefined) updates.logo_pdf_url     = logo_pdf_url;
    if (logo_favicon_url !== undefined) updates.logo_favicon_url = logo_favicon_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const { data, error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('PATCH empresa logos:', e.message);
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
