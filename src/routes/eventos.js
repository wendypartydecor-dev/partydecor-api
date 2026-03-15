const router   = require('express').Router();
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ─── Helpers ────────────────────────────────────────────────

// Genera el siguiente ID de evento: E0001, E0002, ...
async function nextIdEvento() {
  const { data } = await supabase
    .from('eventos')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return 'E0001';
  const num = parseInt(data[0].id.replace(/\D/g, ''), 10);
  return 'E' + String(num + 1).padStart(4, '0');
}

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

// Busca cliente por teléfono o crea uno nuevo — equivalente a _upsertCliente()
async function upsertCliente({ nombre, tel1, tel2, tipo, fuente, dir, idExistente }) {
  if (idExistente) return idExistente;

  // Buscar por teléfono
  if (tel1) {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .eq('tel1', tel1)
      .limit(1);
    if (data && data.length > 0) return data[0].id;
  }

  // Crear nuevo cliente
  const id = await nextIdCliente();
  const { error } = await supabase.from('clientes').insert({
    id,
    nombre,
    tel1:   tel1   || '',
    tel2:   tel2   || '',
    tipo:   tipo   || 'Particular',
    fuente: fuente || 'Sin datos',
    dir:    dir    || ''
  });
  if (error) throw error;
  return id;
}

// ─── Rutas ──────────────────────────────────────────────────

// GET /api/eventos
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_eventos_completo')
      .select('*')
      .order('f_ev', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('GET eventos:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/eventos — crear evento
router.post('/', requireAuth, async (req, res) => {
  try {
    const d = req.body;
    if (!d.nombre)  return res.status(400).json({ error: 'Nombre del cliente requerido' });
    if (!d.tel1)    return res.status(400).json({ error: 'Teléfono principal requerido' });
    if (!d.fecha)   return res.status(400).json({ error: 'Fecha del evento requerida' });

    const idCli = await upsertCliente({
      nombre: d.nombre, tel1: d.tel1, tel2: d.tel2,
      tipo: d.tipo_cli, fuente: d.fuente, dir: d.dir_cli,
      idExistente: d.id_cliente || null
    });

    const id = await nextIdEvento();

    const { data, error } = await supabase
      .from('eventos')
      .insert({
        id,
        f_ev:    d.fecha,
        id_cli:  idCli,
        cli:     d.nombre,
        tipo:    d.tipo    || 'No especificado',
        dir:     d.dir     || '',
        estado:  'Borrador',
        e_pago:  'Pendiente',
        obs:     d.obs     || '',
        iva:     d.iva     || 'No aplica',
        isr:     d.isr     || 'No aplica',
        anticipo: 0,
        total:   0
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, tel1: d.tel1, tel2: d.tel2 || '', tipo_cli: d.tipo_cli || '', fuente: d.fuente || '', dir_cli: d.dir_cli || '', id_cli: idCli });
  } catch (e) {
    console.error('POST eventos:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/eventos/:id — editar evento
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;

    const updates = {};
    if (d.fecha   !== undefined) updates.f_ev    = d.fecha;
    if (d.tipo    !== undefined) updates.tipo    = d.tipo;
    if (d.dir     !== undefined) updates.dir     = d.dir;
    if (d.estado  !== undefined) updates.estado  = d.estado;
    if (d.e_pago  !== undefined) updates.e_pago  = d.e_pago;
    if (d.iva     !== undefined) updates.iva     = d.iva;
    if (d.isr     !== undefined) updates.isr     = d.isr;
    if (d.obs     !== undefined) updates.obs     = d.obs;
    if (d.anticipo !== undefined) updates.anticipo = parseFloat(d.anticipo) || 0;

    if (d.nombre) {
      updates.cli = d.nombre;
      // Actualizar datos del cliente
      const { data: ev } = await supabase.from('eventos').select('id_cli').eq('id', id).single();
      if (ev?.id_cli) {
        const clienteUpdates = {};
        if (d.nombre !== undefined) clienteUpdates.nombre = d.nombre;
        if (d.tel1   !== undefined) clienteUpdates.tel1   = d.tel1;
        if (d.tel2   !== undefined) clienteUpdates.tel2   = d.tel2   || '';
        if (d.tipo_cli !== undefined) clienteUpdates.tipo = d.tipo_cli;
        if (d.fuente !== undefined) clienteUpdates.fuente = d.fuente;
        if (d.dir_cli !== undefined) clienteUpdates.dir   = d.dir_cli;
        if (Object.keys(clienteUpdates).length > 0) {
          await supabase.from('clientes').update(clienteUpdates).eq('id', ev.id_cli);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const { data, error } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data)  return res.status(404).json({ error: 'Evento no encontrado' });

    // Retornar con datos del cliente aplanados
    const { data: completo } = await supabase
      .from('v_eventos_completo')
      .select('*')
      .eq('id', id)
      .single();

    res.json(completo || data);
  } catch (e) {
    console.error('PATCH eventos:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/eventos/:id — solo admin
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // El cascade en la FK borra también el detalle
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE eventos:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/eventos/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('v_eventos_completo')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(data);
  } catch (e) {
    console.error('GET evento:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
