// js/init.js — Inicialización de la aplicación
// Este archivo se carga al final y ejecuta el init()

// Event listeners globales
document.addEventListener('mousedown', e => {
  const dd = document.getElementById('evClienteDd');
  const input = document.getElementById('evClienteSearch');
  if (dd && dd.classList.contains('open') && !dd.contains(e.target) && e.target !== input) {
    ddClear('evClienteDd');
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const abiertos = [...document.querySelectorAll('.modal-backdrop.open')];
  if (abiertos.length) closeModal(abiertos[abiertos.length-1].id);
});

document.addEventListener('touchmove', e => {
  if (document.body.classList.contains('modal-open')) {
    const modal = e.target.closest('.modal');
    if (!modal) e.preventDefault();
  }
}, { passive: false });

function init() {
  loadTheme();
  
  // Cargar usuario y rol
  const savedUser = localStorage.getItem('pd_user');
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      S.usuario = u;
      S.rol = u.rol || 'usuario';
      S.esAdmin = u.es_admin || false;
    } catch(e) {}
  }
  
  // Cargar empresa guardada en login si existe
  const savedEmpresa = localStorage.getItem('pd_empresa');
  if (savedEmpresa) {
    try {
      const emp = JSON.parse(savedEmpresa);
      S.empresa = emp;
      const logoArea = document.getElementById('logoAurea');
      const logoEmp = document.getElementById('logoEmpresa');
      const logoImg = document.getElementById('loginLogoImg');
      const logoNom = document.getElementById('loginEmpresaNombre');
      
      // Solo mostrar logo si hay sesión activa
      if (S.token && emp && (emp.logo_login_url || emp.nombre || emp.empresa)) {
        if (logoArea) logoArea.style.display = 'none';
        if (logoEmp) {
          logoEmp.style.display = 'flex';
          if (logoImg && emp.logo_login_url) logoImg.src = emp.logo_login_url;
          if (logoNom) logoNom.textContent = emp.nombre || emp.empresa || '';
        }
      }
    } catch(e) {}
  }
  
  if (S.token && S.usuario) {
    afterLogin();
  }
}

document.addEventListener('DOMContentLoaded', init);