// src/routes/auth.js  — versión Aurea multi-empresa
// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login          → valida credenciales, devuelve usuario + empresas
//  POST /api/auth/seleccionar    → recibe empresa elegida, devuelve JWT final
//  PATCH /api/auth/metodo-login  → cambia password ↔ pin (ajustes usuario)
// ─────────────────────────────────────────────────────────────
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');


// ═══════════════════════════════════════════════════════════
//  POST /api/auth/login
//  Body: { pin: "1234" }  O  { password: "abc", usuario: "Admin" }
//
//  El campo `metodo_login` del usuario en BD define cuál se acepta,
//  pero el backend siempre valida ambos para no romper flujos existentes.
//
//  Response 200:
//    Si el usuario tiene UNA sola empresa  → { token, usuario, empresa }
//    Si tiene MÁS de una                  → { token_temp, usuario, empresas[] }
//      (token_temp es JWT de corta duración, solo para llamar /seleccionar)
// ═══════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { pin, password, usuario: nombreUsuario } = req.body;

    if (!pin && !password) {
      return res.status(400).json({ error: 'PIN o contraseña requeridos' });
    }

    // Traer todos los usuarios activos (son pocos)
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nombre, pin_hash, es_admin, activo, metodo_login, rol');

    console.log('Usuarios BD:', JSON.stringify(usuarios));
    if (error) throw error;

    let usuarioValido = null;

    if (pin) {
      // Autenticación por PIN — busca en todos los usuarios activos
      for (const u of usuarios) {
        console.log('Usuario:', u.nombre, 'rol:', u.rol);
        if (!u.activo) continue;
        const match = await bcrypt.compare(String(pin), u.pin_hash);
        if (match) { usuarioValido = u; break; }
      }
    } else {
      // Autenticación por contraseña — filtra por nombre primero
      const candidato = usuarios.find(
        u => u.activo && u.nombre.toLowerCase() === (nombreUsuario || '').toLowerCase()
      );
      if (candidato) {
        const match = await bcrypt.compare(String(password), candidato.pin_hash);
        if (match) usuarioValido = candidato;
      }
    }

    if (!usuarioValido) {
      return res.status(401).json({ error: pin ? 'PIN incorrecto' : 'Usuario o contraseña incorrectos' });
    }

    // Traer empresas del usuario
    const { data: empresas, error: errEmp } = await supabase
      .from('v_usuarios_empresas')
      .select(
        'id_empresa, empresa, nombre_corto, rol, ' +
        'logo_login_url, logo_header_url, logo_pdf_url, ' +
        'logo_favicon_url, color_primario, tema_default'
      )
      .eq('id_usuario', usuarioValido.id);

    if (errEmp) throw errEmp;

    const usuarioPayload = {
      id:           usuarioValido.id,
      nombre:       usuarioValido.nombre,
      es_admin:     usuarioValido.es_admin,
      metodo_login: usuarioValido.metodo_login,
      rol:          usuarioValido.rol || 'usuario'
    };

    // ── Caso A: una sola empresa → JWT definitivo directo ──
    if (!empresas || empresas.length <= 1) {
      const empresa = empresas?.[0] || null;

      const token = jwt.sign(
        { ...usuarioPayload, rol: usuarioValido.rol || 'usuario', empresa_id: empresa?.id_empresa || null, rol_empresa: empresa?.rol || null },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.json({ token, usuario: usuarioPayload, empresa: empresa || null });
    }

    // ── Caso B: múltiples empresas → token_temp de 5 min ──
    const token_temp = jwt.sign(
      { ...usuarioPayload, _temp: true },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ token_temp, usuario: usuarioPayload, empresas });

  } catch (e) {
    console.error('login:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════
//  POST /api/auth/seleccionar
//  Header: Authorization: Bearer <token_temp>
//  Body:   { empresa_id: "PD001" }
//
//  Valida que el usuario tenga acceso a esa empresa
//  y devuelve el JWT definitivo con empresa_id incluido.
// ═══════════════════════════════════════════════════════════
router.post('/seleccionar', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    let payload;
    try {
      payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    if (!payload._temp) {
      return res.status(400).json({ error: 'Usa este endpoint solo con token_temp' });
    }

    const { empresa_id } = req.body;
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });

    // Verificar acceso
    const { data: acceso, error } = await supabase
      .from('usuario_empresa')
      .select('rol')
      .eq('id_usuario', payload.id)
      .eq('id_empresa', empresa_id)
      .eq('activo', true)
      .single();

    if (error || !acceso) {
      return res.status(403).json({ error: 'Sin acceso a esta empresa' });
    }

    // Traer config de la empresa seleccionada
    const { data: empresa } = await supabase
      .from('empresas')
      .select(
        'id, nombre, nombre_corto, ' +
        'logo_header_url, logo_pdf_url, logo_favicon_url, ' +
        'color_primario, tema_default'
      )
      .eq('id', empresa_id)
      .single();

    const token = jwt.sign(
      {
        id:           payload.id,
        nombre:       payload.nombre,
        es_admin:     payload.es_admin,
        metodo_login: payload.metodo_login,
        rol:          payload.rol || 'usuario',
        empresa_id,
        rol_empresa:  acceso.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, empresa });

  } catch (e) {
    console.error('seleccionar empresa:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════
//  PATCH /api/auth/metodo-login
//  Autenticado. Cambia el método de login preferido del usuario.
//  Body: { metodo: "pin" | "password" }
//
//  Si cambia a "pin" y no tenía pin seteado, puede
//  enviar también { nuevo_pin: "1234" } para crearlo.
// ═══════════════════════════════════════════════════════════
router.patch('/metodo-login', requireAuth, async (req, res) => {
  try {
    const { metodo, nuevo_pin } = req.body;

    if (!['pin', 'password'].includes(metodo)) {
      return res.status(400).json({ error: 'metodo debe ser "pin" o "password"' });
    }

    const updates = { metodo_login: metodo };

    if (nuevo_pin) {
      if (String(nuevo_pin).length < 4 || String(nuevo_pin).length > 8) {
        return res.status(400).json({ error: 'El PIN debe tener entre 4 y 8 dígitos' });
      }
      updates.pin_hash = await bcrypt.hash(String(nuevo_pin), 10);
    }

    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', req.user.id);

    if (error) throw error;

    res.json({ ok: true, metodo_login: metodo });
  } catch (e) {
    console.error('metodo-login:', e.message);
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
