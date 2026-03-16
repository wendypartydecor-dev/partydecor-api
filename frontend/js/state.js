// js/state.js — Estado global de la aplicación
const S = {
  token: localStorage.getItem('pd_token'),
  usuario: JSON.parse(localStorage.getItem('pd_user') || 'null'),
  empresa: JSON.parse(localStorage.getItem('pd_empresa') || 'null'),
  
  empresas: [],
  eventos: [],
  eventosFilt: [],
  clientes: [],
  catalogo: [],
  
  evExpandido: null,
  filterActivo: 'todos',
  pinBuf: '',
  
  theme: localStorage.getItem('pd_theme') || 'neutro',
  mode: localStorage.getItem('pd_mode') || 'dark',
  
  clienteEditId: null,
  _desdeEvento: false,
  
  esAdmin: false,
  rol: null,
  rol_empresa: null,
};

function getRolDisplay(u) {
  if (u?.es_admin) return 'Admin';
  const rol = u?.rol || 'usuario';
  const labels = { super_admin: 'Super Admin', admin: 'Admin', usuario: 'Usuario', solo_lectura: 'Solo lectura' };
  return labels[rol] || rol;
}