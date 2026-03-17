const router   = require('express').Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');

// Listas fijas — equivalente a obtenerListas() en Apps Script
const LISTAS = {
  tiposCliente:   ['Particular','Empresa','Gobierno','Decorador/a'],
  fuentesCliente: ['Instagram','Facebook','WhatsApp','Recomendado','Sin datos','Otro'],
  tiposEvento:    ['Boda fiesta','Boda civil','XV años','Cumpleaños','Empresarial','Fiesta','Fecha festiva','No especificado'],
  estadosPago:    ['Pendiente','Realizado'],
  estadosEvento:  ['Borrador','Cotizado','Confirmado','En proceso','Entregado','Cancelado'],
  opcionesIva:    ['No aplica','8%','16%'],
  opcionesIsr:    ['No aplica','ISR 1.25%']
};

// GET /api/listas
router.get('/', requireAuth, (req, res) => {
  res.json(LISTAS);
});

// GET /api/listas/clientes
router.get('/clientes', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre, tel1, tel2, tipo, fuente, dir, obs')
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('clientes:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/listas/catalogo
router.get('/catalogo', requireAuth, async (req, res) => {
  try {
    const { limit = 500, offset = 0 } = req.query;
    const idEmpresa = req.user.empresa_id;
    
    let query = supabase
      .from('catalogo_precios')
      .select('id, categoria, nombre, tipo_precio, precio, unidad, permite_cambio, notas', { count: 'exact' })
      .eq('activo', true)
      .order('categoria')
      .order('nombre')
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    
    // Filtrar por empresa si existe, sino mostrar los globales
    if (idEmpresa) {
      query = query.or(`id_empresa.eq.${idEmpresa},id_empresa.is.null`);
    }
    
    const { data, error } = await query;
    if (error) throw error;

    const items = (data || []).map(i => ({
      ...i,
      es_variable: i.precio === 0 || i.tipo_precio === 'variable'
    }));

    res.json({ data: items, limit: Number(limit), offset: Number(offset) });
  } catch (e) {
    console.error('catalogo:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
