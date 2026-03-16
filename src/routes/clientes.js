const router = require('express').Router();
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { nextIdCliente } = require('../utils/db');

// GET /api/clientes
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const { data, error } = await supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .eq('activo', true)
      .eq('id_empresa', req.user.empresa_id)
      .order('nombre')
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (error) throw error;
    res.json({ data, limit: Number(limit), offset: Number(offset) });
  } catch (e) {
    console.error('GET clientes:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/clientes/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .eq('id_empresa', req.user.empresa_id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(data);
  } catch (e) {
    console.error('GET cliente:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clientes
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nombre, tel1, tel2, tipo, fuente, dir } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    if (!tel1) return res.status(400).json({ error: 'Teléfono principal requerido' });

    const id = await nextIdCliente(req.user.empresa_id);
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        id,
        nombre,
        tel1: tel1 || '',
        tel2: tel2 || '',
        tipo: tipo || 'Particular',
        fuente: fuente || 'Sin datos',
        dir: dir || '',
        activo: true,
        id_empresa: req.user.empresa_id  // ← asignar empresa
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    console.error('POST cliente:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/clientes/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el cliente pertenezca a la empresa del usuario
    const { data: existing } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', id)
      .eq('id_empresa', req.user.empresa_id)
      .single();
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado o no pertenece a tu empresa' });
    }

    const { nombre, tel1, tel2, tipo, fuente, dir } = req.body;
    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (tel1 !== undefined) updates.tel1 = tel1;
    if (tel2 !== undefined) updates.tel2 = tel2;
    if (tipo !== undefined) updates.tipo = tipo;
    if (fuente !== undefined) updates.fuente = fuente;
    if (dir !== undefined) updates.dir = dir;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .eq('id_empresa', req.user.empresa_id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('PATCH cliente:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/clientes/:id (solo admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar pertenencia
    const { data: existing } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', id)
      .eq('id_empresa', req.user.empresa_id)
      .single();
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado o no pertenece a tu empresa' });
    }

    const { error } = await supabase
      .from('clientes')
      .update({ activo: false })
      .eq('id', id)
      .eq('id_empresa', req.user.empresa_id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE cliente:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;