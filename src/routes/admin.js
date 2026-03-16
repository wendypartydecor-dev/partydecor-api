// src/routes/admin.js — Panel de Administración
// ═══════════════════════════════════════════════════════════════
// Rutas solo para Super Admin: gestión global de empresas y usuarios
// ═══════════════════════════════════════════════════════════════
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const ROLES = ['super_admin', 'admin', 'usuario', 'solo_lectura'];
const ROLES_EMPRESA = ['admin', 'empleado', 'solo_lectura'];

// ═══════════════════════════════════════════════════════════════
// USUARIOS — Super Admin puede ver/crear/editar todos
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/usuarios — listar todos los usuarios
router.get('/usuarios', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, telefono, rol, es_admin, activo, created_at, metodo_login')
      .order('nombre');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    console.error('GET admin usuarios:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/usuarios/:id — detalle de usuario
router.get('/usuarios/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, telefono, rol, es_admin, activo, created_at, metodo_login')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Traer empresas a las que tiene acceso
    const { data: empresas } = await supabase
      .from('usuario_empresa')
      .select('id_empresa, rol, activo')
      .eq('id_usuario', id);

    res.json({ ...usuario, empresas: empresas || [] });
  } catch (e) {
    console.error('GET admin usuario:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/usuarios — crear usuario
router.post('/usuarios', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { nombre, email, telefono, rol, password, pin, es_admin } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    if (!password && !pin) return res.status(400).json({ error: 'PIN o contraseña requeridos' });
    if (rol && !ROLES.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });

    const hash = await bcrypt.hash(String(password || pin), 10);
    const nuevoRol = rol || 'usuario';

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        pin_hash: hash,
        email: email || '',
        telefono: telefono || '',
        rol: nuevoRol,
        es_admin: es_admin || nuevoRol === 'super_admin',
        activo: true,
        metodo_login: pin ? 'pin' : 'password'
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (e) {
    console.error('POST admin usuario:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/usuarios/:id — editar usuario
router.patch('/usuarios/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, rol, password, pin, es_admin, activo } = req.body;

    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (email !== undefined) updates.email = email;
    if (telefono !== undefined) updates.telefono = telefono;
    if (rol !== undefined) {
      if (!ROLES.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
      updates.rol = rol;
    }
    if (es_admin !== undefined) updates.es_admin = es_admin;
    if (activo !== undefined) updates.activo = activo;
    if (password !== undefined) updates.pin_hash = await bcrypt.hash(password, 10);
    if (pin !== undefined) {
      updates.pin_hash = await bcrypt.hash(String(pin), 10);
      updates.metodo_login = 'pin';
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('PATCH admin usuario:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/usuarios/:id — desactivar usuario
router.delete('/usuarios/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // No permitir eliminarse a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
    }
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE admin usuario:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/usuarios/:id/empresas — asignar empresa a usuario
router.post('/usuarios/:id/empresas', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_empresa, rol } = req.body;
    if (!id_empresa) return res.status(400).json({ error: 'id_empresa requerido' });
    if (rol && !ROLES_EMPRESA.includes(rol)) return res.status(400).json({ error: 'Rol de empresa inválido' });

    // Verificar que la empresa existe
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', id_empresa)
      .single();
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { error } = await supabase
      .from('usuario_empresa')
      .upsert({
        id_usuario: parseInt(id),
        id_empresa,
        rol: rol || 'empleado',
        activo: true
      }, { onConflict: 'id_usuario,id_empresa' });
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.error('POST admin usuario-empresa:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/usuarios/:id/empresas/:id_empresa — quitar empresa
router.delete('/usuarios/:id/empresas/:id_empresa', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id, id_empresa } = req.params;
    const { error } = await supabase
      .from('usuario_empresa')
      .update({ activo: false })
      .eq('id_usuario', parseInt(id))
      .eq('id_empresa', id_empresa);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE admin usuario-empresa:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// EMPRESAS — Super Admin puede crear/editar todas
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/empresas — listar todas las empresas
router.get('/empresas', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    console.error('GET admin empresas:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/empresas/:id — detalle de empresa
router.get('/empresas/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(data);
  } catch (e) {
    console.error('GET admin empresa:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/empresas — crear empresa
router.post('/empresas', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id, nombre, nombre_corto, color_primario, tema_default, rfc, direccion, telefono, email, sitio_web } = req.body;
    if (!id) return res.status(400).json({ error: 'ID de empresa requerido' });
    if (!nombre) return res.status(400).json({ error: 'Nombre de empresa requerido' });

    // Generar ID si no se proporciona (formato: PD001, EM001, etc.)
    const idEmpresa = id.toUpperCase();

    const { data, error } = await supabase
      .from('empresas')
      .insert({
        id: idEmpresa,
        nombre,
        nombre_corto: nombre_corto || '',
        color_primario: color_primario || '#a0a0a0',
        tema_default: tema_default || 'neutro',
        rfc: rfc || '',
        direccion: direccion || '',
        telefono: telefono || '',
        email: email || '',
        sitio_web: sitio_web || '',
        activo: true
      })
      .select()
      .single();
    if (error) throw error;

    // Crear carpeta en Storage para logos
    try {
      await supabase.storage.createFolder('logos', idEmpresa);
    } catch (storageErr) {
      console.warn('Storage folder creation skipped:', storageErr.message);
    }

    res.status(201).json(data);
  } catch (e) {
    console.error('POST admin empresa:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/empresas/:id — editar empresa
router.patch('/empresas/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, nombre_corto, color_primario, tema_default, rfc, direccion, telefono, email, sitio_web, activo, logo_login_url, logo_header_url, logo_pdf_url, logo_favicon_url } = req.body;

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
    if (activo !== undefined) updates.activo = activo;
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
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('PATCH admin empresa:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/empresas/:id — desactivar empresa
router.delete('/empresas/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('empresas')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE admin empresa:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;