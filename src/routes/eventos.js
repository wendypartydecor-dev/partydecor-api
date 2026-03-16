const router   = require('express').Router();
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { nextIdCliente, nextIdEvento, getEventoWithEmpresa } = require('../utils/db');

async function upsertCliente({ nombre, tel1, tel2, tipo, fuente, dir, idExistente, idEmpresa }) {
  if (idExistente) return idExistente;

  if (tel1) {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .eq('tel1', tel1)
      .eq('id_empresa', idEmpresa)
      .limit(1);
    if (data && data.length > 0) return data[0].id;
  }

  const id = await nextIdCliente(idEmpresa);
  const { error } = await supabase.from('clientes').insert({
    id,
    nombre,
    tel1:   tel1   || '',
    tel2:   tel2   || '',
    tipo:   tipo   || 'Particular',
    fuente: fuente || 'Sin datos',
    dir:    dir    || '',
    id_empresa: idEmpresa,
    activo: true
  });
  if (error) throw error;
  return id;
}

// ─── Rutas ──────────────────────────────────────────────────

// GET /api/eventos
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const { data, error } = await supabase
      .from('v_eventos_completo')
      .select('*', { count: 'exact' })
      .eq('id_empresa', req.user.empresa_id)
      .order('f_ev', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (error) throw error;
    res.json({ data, limit: Number(limit), offset: Number(offset) });
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

    const idEmpresa = req.user.empresa_id;
    const idCli = await upsertCliente({
      nombre: d.nombre, tel1: d.tel1, tel2: d.tel2,
      tipo: d.tipo_cli, fuente: d.fuente, dir: d.dir_cli,
      idExistente: d.id_cliente || null,
      idEmpresa
    });

    const id = await nextIdEvento(idEmpresa);

    const { data, error } = await supabase
      .from('eventos')
      .insert({
        id,
        f_ev:      d.fecha,
        id_cli:    idCli,
        id_empresa: idEmpresa,
        cli:       d.nombre,
        tipo:      d.tipo    || 'No especificado',
        dir:       d.dir     || '',
        estado:    'Borrador',
        e_pago:    'Pendiente',
        obs:       d.obs     || '',
        iva:       d.iva     || 'No aplica',
        isr:       d.isr     || 'No aplica',
        anticipo:  0,
        total:     0
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
    const idEmpresa = req.user.empresa_id;

    const existing = await getEventoWithEmpresa(id, idEmpresa);
    if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

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
      if (existing.id_cli) {
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
    const idEmpresa = req.user.empresa_id;

    const existing = await getEventoWithEmpresa(id, idEmpresa);
    if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

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
    const data = await getEventoWithEmpresa(id, req.user.empresa_id);
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(data);
  } catch (e) {
    console.error('GET evento:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
