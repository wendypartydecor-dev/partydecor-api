const router   = require('express').Router();
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ─── Helper: obtener items de un evento ─────────────────────
async function getItems(idEvento) {
  const { data, error } = await supabase
    .from('detalle_cotizacion')
    .select('id, id_item, nombre, tipo, cantidad, precio, costo, total, proveedor, descripcion')
    .eq('id_ev', idEvento)
    .order('id');
  if (error) throw error;

  // Enriquecer con categoría del catálogo
  const { data: cat } = await supabase
    .from('catalogo_precios')
    .select('nombre, categoria, tipo_precio');
  const catMap = {};
  (cat || []).forEach(c => { catMap[c.nombre] = { categoria: c.categoria, tipo_precio: c.tipo_precio }; });

  return (data || []).map(it => ({
    id:          it.id,
    item:        it.nombre,
    cantidad:    it.cantidad,
    precio:      parseFloat(it.precio),
    costo:       parseFloat(it.costo),
    total:       parseFloat(it.total),
    descripcion: it.descripcion || '',
    proveedor:   it.proveedor   || '',
    categoria:   catMap[it.nombre]?.categoria || '',
    es_variable: parseFloat(it.precio) === 0 || (catMap[it.nombre]?.tipo_precio === 'variable')
  }));
}

// GET /api/items/:idEvento
router.get('/:idEvento', requireAuth, async (req, res) => {
  try {
    res.json(await getItems(req.params.idEvento));
  } catch (e) {
    console.error('GET items:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/items/:idEvento — agregar item del catálogo
// Body: { nombre, cantidad, precio?, desc?, proveedor?, costo? }
router.post('/:idEvento', requireAuth, async (req, res) => {
  try {
    const idEvento  = req.params.idEvento;
    const { nombre, cantidad: cantRaw, precio: precioRaw, desc, proveedor, costo: costoRaw } = req.body;

    if (!nombre)                              return res.status(400).json({ error: 'Nombre requerido' });
    const cantidad = parseInt(cantRaw, 10);
    if (isNaN(cantidad) || cantidad < 1)      return res.status(400).json({ error: 'Cantidad inválida' });

    // Buscar en catálogo
    const { data: catItem } = await supabase
      .from('catalogo_precios')
      .select('id, tipo_precio, precio')
      .eq('nombre', nombre)
      .eq('activo', true)
      .single();
    if (!catItem) return res.status(404).json({ error: 'Item no encontrado en catálogo: ' + nombre });

    const precio = parseFloat(precioRaw) || parseFloat(catItem.precio) || 0;
    const costo  = parseFloat(costoRaw) || 0;

    // ¿Ya existe este item en el evento?
    const { data: existente } = await supabase
      .from('detalle_cotizacion')
      .select('id, cantidad, precio')
      .eq('id_ev', idEvento)
      .eq('nombre', nombre)
      .single();

    if (existente) {
      // Sumar cantidad
      const nuevaCant = existente.cantidad + cantidad;
      const pFinal    = precio || parseFloat(existente.precio);
      await supabase
        .from('detalle_cotizacion')
        .update({ cantidad: nuevaCant, precio: pFinal, total: nuevaCant * pFinal })
        .eq('id', existente.id);
    } else {
      await supabase.from('detalle_cotizacion').insert({
        id_ev:      idEvento,
        id_item:    catItem.id,
        nombre,
        tipo:       catItem.tipo_precio,
        cantidad,
        precio,
        costo,
        total:      cantidad * precio,
        proveedor:  proveedor || '',
        descripcion: desc     || ''
      });
    }

    // Retornar lista actualizada (el trigger ya actualizó eventos.total)
    res.json({ ok: true, items: await getItems(idEvento) });
  } catch (e) {
    console.error('POST items:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/items/:idEvento/externo — agregar item externo
// Body: { nombre, cantidad, precio, desc?, costo? }
router.post('/:idEvento/externo', requireAuth, async (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const { nombre, cantidad: cantRaw, precio: precioRaw, desc, costo: costoRaw } = req.body;

    if (!nombre)                            return res.status(400).json({ error: 'Nombre requerido' });
    const cantidad = parseInt(cantRaw, 10);
    if (isNaN(cantidad) || cantidad < 1)    return res.status(400).json({ error: 'Cantidad inválida' });
    const precio = parseFloat(precioRaw) || 0;
    const costo  = parseFloat(costoRaw)  || 0;

    // ¿Ya existe?
    const { data: existente } = await supabase
      .from('detalle_cotizacion')
      .select('id, cantidad')
      .eq('id_ev', idEvento)
      .eq('nombre', nombre)
      .single();

    if (existente) {
      const nuevaCant = existente.cantidad + cantidad;
      await supabase
        .from('detalle_cotizacion')
        .update({ cantidad: nuevaCant, total: nuevaCant * precio })
        .eq('id', existente.id);
    } else {
      await supabase.from('detalle_cotizacion').insert({
        id_ev:      idEvento,
        id_item:    'EXT',
        nombre,
        tipo:       'Externo',
        cantidad,
        precio,
        costo,
        total:      cantidad * precio,
        descripcion: desc || ''
      });
    }

    res.json({ ok: true, items: await getItems(idEvento) });
  } catch (e) {
    console.error('POST externo:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/items/:idEvento/cantidad — actualizar cantidad
// Body: { nombre, cantidad }
router.patch('/:idEvento/cantidad', requireAuth, async (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const { nombre, cantidad: cantRaw } = req.body;
    const cantidad = parseInt(cantRaw, 10);

    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    // Si cantidad < 1, eliminar
    if (isNaN(cantidad) || cantidad < 1) {
      await supabase
        .from('detalle_cotizacion')
        .delete()
        .eq('id_ev', idEvento)
        .eq('nombre', nombre);
      return res.json({ ok: true });
    }

    const { data: item } = await supabase
      .from('detalle_cotizacion')
      .select('precio')
      .eq('id_ev', idEvento)
      .eq('nombre', nombre)
      .single();
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    await supabase
      .from('detalle_cotizacion')
      .update({ cantidad, total: cantidad * parseFloat(item.precio) })
      .eq('id_ev', idEvento)
      .eq('nombre', nombre);

    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH cantidad:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/items/:idEvento/precio — actualizar precio
// Body: { nombre, precio }
router.patch('/:idEvento/precio', requireAuth, async (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const { nombre, precio: precioRaw } = req.body;
    const precio = parseFloat(precioRaw);

    if (!nombre)              return res.status(400).json({ error: 'Nombre requerido' });
    if (isNaN(precio) || precio < 0) return res.status(400).json({ error: 'Precio inválido' });

    const { data: item } = await supabase
      .from('detalle_cotizacion')
      .select('cantidad')
      .eq('id_ev', idEvento)
      .eq('nombre', nombre)
      .single();
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    await supabase
      .from('detalle_cotizacion')
      .update({ precio, total: item.cantidad * precio })
      .eq('id_ev', idEvento)
      .eq('nombre', nombre);

    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH precio:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/items/:idEvento/:nombre — eliminar item
router.delete('/:idEvento/:nombre', requireAuth, async (req, res) => {
  try {
    const { idEvento, nombre } = req.params;
    await supabase
      .from('detalle_cotizacion')
      .delete()
      .eq('id_ev', idEvento)
      .eq('nombre', decodeURIComponent(nombre));
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE item:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/items/:idEvento — limpiar toda la cotización (solo admin)
router.delete('/:idEvento', requireAuth, requireAdmin, async (req, res) => {
  try {
    await supabase
      .from('detalle_cotizacion')
      .delete()
      .eq('id_ev', req.params.idEvento);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE cotizacion:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
