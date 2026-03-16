// src/routes/empresaConfig.js — Configuración de empresa para admins
// ═══════════════════════════════════════════════════════════════
// Admin de empresa puede configurar: logos, listas, tema, etc.
// ═══════════════════════════════════════════════════════════════
const router = require('express').Router();
const supabase = require('../supabase');
const { requireAuth, requireAdminEmpresa } = require('../middleware/auth');

// Helper: verificar que el usuario es admin de la empresa
async function verificarAdminEmpresa(usuarioId, empresaId) {
  const { data } = await supabase
    .from('usuario_empresa')
    .select('rol')
    .eq('id_usuario', usuarioId)
    .eq('id_empresa', empresaId)
    .eq('activo', true)
    .single();
  return data?.rol === 'admin';
}

// GET /api/empresa/config — obtener config de mi empresa
router.get('/config', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', req.user.empresa_id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('GET empresa config:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/empresa/config — actualizar config de mi empresa
router.patch('/config', requireAuth, requireAdminEmpresa, async (req, res) => {
  try {
    const esAdmin = await verificarAdminEmpresa(req.user.id, req.user.empresa_id);
    if (!esAdmin) return res.status(403).json({ error: 'Solo el admin de la empresa puede editar' });

    const { nombre, nombre_corto, color_primario, tema_default, rfc, direccion, telefono, email, sitio_web, logo_login_url, logo_header_url, logo_pdf_url, logo_favicon_url } = req.body;

    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (nombre_corto !== undefined) updates.nombre_corto = nombre_corto;
    if (color_primario !== undefined) updates.color_primario = color_primario;
    if (tema_default !== undefined) updates.tema_default = tema_default;
    if (rfc !== undefined) updates.rfc = rfc;
    if (direccion !== undefined) updates.direccion = direccion;
    if (telefono !== undefined) updates.telefono = telefono;
    if (email !== undefined) updates.email = email;
    if (sitio_web !== undefined) updates.sitio_web = sitio_web;
    if (logo_login_url !== undefined) updates.logo_login_url = logo_login_url;
    if (logo_header_url !== undefined) updates.logo_header_url = logo_header_url;
    if (logo_pdf_url !== undefined) updates.logo_pdf_url = logo_pdf_url;
    if (logo_favicon_url !== undefined) updates.logo_favicon_url = logo_favicon_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const { data, error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', req.user.empresa_id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('PATCH empresa config:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/empresa/usuarios — usuarios de mi empresa
router.get('/usuarios', requireAuth, requireAdminEmpresa, async (req, res) => {
  try {
    const esAdmin = await verificarAdminEmpresa(req.user.id, req.user.empresa_id);
    if (!esAdmin) return res.status(403).json({ error: 'Solo el admin de la empresa puede ver usuarios' });

    const { data, error } = await supabase
      .from('v_usuarios_empresas')
      .select('id_usuario, nombre, email, telefono, rol, activo')
      .eq('id_empresa', req.user.empresa_id);
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    console.error('GET empresa usuarios:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/empresa/usuarios — agregar usuario a mi empresa
router.post('/usuarios', requireAuth, requireAdminEmpresa, async (req, res) => {
  try {
    const esAdmin = await verificarAdminEmpresa(req.user.id, req.user.empresa_id);
    if (!esAdmin) return res.status(403).json({ error: 'Solo el admin de la empresa puede agregar usuarios' });

    const { id_usuario, rol } = req.body;
    if (!id_usuario) return res.status(400).json({ error: 'ID de usuario requerido' });

    // Verificar que el usuario existe
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', id_usuario)
      .single();
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { error } = await supabase
      .from('usuario_empresa')
      .upsert({
        id_usuario,
        id_empresa: req.user.empresa_id,
        rol: rol || 'empleado',
        activo: true
      }, { onConflict: 'id_usuario,id_empresa' });
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.error('POST empresa usuario:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/empresa/usuarios/:id — editar rol de usuario en empresa
router.patch('/usuarios/:id', requireAuth, requireAdminEmpresa, async (req, res) => {
  try {
    const esAdmin = await verificarAdminEmpresa(req.user.id, req.user.empresa_id);
    if (!esAdmin) return res.status(403).json({ error: 'Solo el admin puede editar usuarios' });

    const { rol, activo } = req.body;
    const updates = {};
    if (rol !== undefined) {
      if (!['admin', 'empleado', 'solo_lectura'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      updates.rol = rol;
    }
    if (activo !== undefined) updates.activo = activo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const { error } = await supabase
      .from('usuario_empresa')
      .update(updates)
      .eq('id_usuario', parseInt(req.params.id))
      .eq('id_empresa', req.user.empresa_id);
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH empresa usuario:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/empresa/usuarios/:id — quitar usuario de empresa
router.delete('/usuarios/:id', requireAuth, requireAdminEmpresa, async (req, res) => {
  try {
    const esAdmin = await verificarAdminEmpresa(req.user.id, req.user.empresa_id);
    if (!esAdmin) return res.status(403).json({ error: 'Solo el admin puede quitar usuarios' });

    const { error } = await supabase
      .from('usuario_empresa')
      .update({ activo: false })
      .eq('id_usuario', parseInt(req.params.id))
      .eq('id_empresa', req.user.empresa_id);
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE empresa usuario:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/empresa/listas — listas configurables de la empresa
router.get('/listas', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('empresas_listas')
      .select('*')
      .eq('id_empresa', req.user.empresa_id);
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    console.error('GET empresa listas:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/empresa/listas — actualizar listas de la empresa
router.patch('/listas', requireAuth, requireAdminEmpresa, async (req, res) => {
  try {
    const esAdmin = await verificarAdminEmpresa(req.user.id, req.user.empresa_id);
    if (!esAdmin) return res.status(403).json({ error: 'Solo el admin puede editar listas' });

    const { tiposCliente, fuentesCliente, tiposEvento } = req.body;

    // Actualizar o insertar cada lista
    const listas = [
      { clave: 'tiposCliente', valor: tiposCliente },
      { clave: 'fuentesCliente', valor: fuentesCliente },
      { clave: 'tiposEvento', valor: tiposEvento }
    ];

    for (const lista of listas) {
      if (lista.valor) {
        await supabase
          .from('empresas_listas')
          .upsert({
            id_empresa: req.user.empresa_id,
            clave: lista.clave,
            valores: lista.valor,
            activo: true
          }, { onConflict: 'id_empresa,clave' });
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH empresa listas:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;