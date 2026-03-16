// js/utils.js — Utilidades varias
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(n) {
  return Number(n||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function formatFechaHist(f) {
  if (!f) return '';
  try { return new Date(f).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}); }
  catch { return f; }
}

function toast(msg, type='') {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast'+(type?' '+type:''); 
  t.textContent = msg;
  w.appendChild(t); 
  setTimeout(()=>t.remove(), 2800);
}

function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}