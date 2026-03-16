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
  if (S.token && S.usuario) {
    afterLogin();
  }
}

document.addEventListener('DOMContentLoaded', init);