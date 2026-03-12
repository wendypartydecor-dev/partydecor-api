const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const supabase = require('../supabase');

// POST /api/auth/login
// Body: { pin: "1234" }
// Responde con JWT si el PIN es válido
router.post('/login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'PIN requerido' });

    // Traer todos los usuarios activos (son pocos — 2 o 3 máximo)
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nombre, pin_hash, es_admin, activo')
      .eq('activo', true);

    if (error) throw error;

    // Buscar el usuario cuyo pin_hash coincide
    let usuarioValido = null;
    for (const u of usuarios) {
      const match = await bcrypt.compare(String(pin), u.pin_hash);
      if (match) { usuarioValido = u; break; }
    }

    if (!usuarioValido) {
      return res.status(401).json({ error: 'PIN incorrecto' });
    }

    const token = jwt.sign(
      { id: usuarioValido.id, nombre: usuarioValido.nombre, es_admin: usuarioValido.es_admin },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      usuario: {
        id:       usuarioValido.id,
        nombre:   usuarioValido.nombre,
        es_admin: usuarioValido.es_admin
      }
    });
  } catch (e) {
    console.error('login:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
