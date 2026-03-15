const router = require('express').Router();
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Genera el siguiente ID de cliente: C001, C002, ...
async function nextIdCliente() {
  const { data } = await supabase
    .from('clientes')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return 'C001';
  const num = parseInt(data[0].id.replace(/\D/g, ''), 10);
  return 'C' + String(num + 1).padStart(3, '0');
}

// GET /api/clientes
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    res.json(data);
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

    const id = await nextIdCliente();
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
        activo: true
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
      .eq('activo', true)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Cliente no encontrado' });
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
    const { error } = await supabase
      .from('clientes')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE cliente:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;