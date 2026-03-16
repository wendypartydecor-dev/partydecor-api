const supabase = require('../supabase');

async function nextIdCliente(idEmpresa) {
  const { data } = await supabase
    .from('clientes')
    .select('id')
    .eq('id_empresa', idEmpresa)
    .order('id', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return 'C001';
  const num = parseInt(data[0].id.replace(/\D/g, ''), 10);
  return 'C' + String(num + 1).padStart(3, '0');
}

async function nextIdEvento(idEmpresa) {
  const { data } = await supabase
    .from('eventos')
    .select('id')
    .eq('id_empresa', idEmpresa)
    .order('id', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return 'E0001';
  const num = parseInt(data[0].id.replace(/\D/g, ''), 10);
  return 'E' + String(num + 1).padStart(4, '0');
}

async function getEventoWithEmpresa(id, empresaId) {
  const { data, error } = await supabase
    .from('v_eventos_completo')
    .select('*')
    .eq('id', id)
    .eq('id_empresa', empresaId)
    .single();
  if (error) throw error;
  return data;
}

module.exports = { nextIdCliente, nextIdEvento, getEventoWithEmpresa };