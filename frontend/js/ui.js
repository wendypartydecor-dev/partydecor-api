// js/ui.js — Funciones de UI y navegación
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function navTo(sec) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec' + sec.charAt(0).toUpperCase() + sec.slice(1))?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + sec)?.classList.add('active');
  document.querySelectorAll('.bnav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('bnav-' + sec)?.classList.add('active');
  closeSidebar();
  const fab = document.getElementById('fabBtn');
  if (fab) fab.style.display = sec === 'eventos' ? 'flex' : 'none';
}

function toggleSidebar() {
  const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay');
  const open = s.classList.toggle('open'); o.classList.toggle('visible', open);
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('visible');
}

// Temas
function setTheme(theme) {
  S.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pd_theme', theme);
  document.querySelectorAll('.theme-opt').forEach(el => el.classList.toggle('selected', el.dataset.theme === theme));
  actualizarLogos();
}

function setMode(mode) {
  S.mode = mode;
  document.documentElement.setAttribute('data-mode', mode);
  localStorage.setItem('pd_mode', mode);
  document.getElementById('modeLight')?.classList.toggle('active', mode === 'light');
  document.getElementById('modeDark')?.classList.toggle('active',  mode === 'dark');
  actualizarLogos();
}

function loadTheme() {
  const t = localStorage.getItem('pd_theme') || 'neutro';
  const m = localStorage.getItem('pd_mode')  || 'dark';
  S.theme = t; S.mode = m;
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.setAttribute('data-mode',  m);
  document.getElementById('modeLight')?.classList.toggle('active', m === 'light');
  document.getElementById('modeDark')?.classList.toggle('active',  m === 'dark');
  document.querySelectorAll('.theme-opt').forEach(el => el.classList.toggle('selected', el.dataset.theme === t));
  actualizarLogos();
}

function actualizarLogos() {
  const emp = S.empresa; if (!emp) return;
  const ll = document.getElementById('loginLogoImg'); if (ll && emp.logo_login_url)  ll.src = emp.logo_login_url;
  const al = document.getElementById('appLogo');      if (al && emp.logo_header_url) al.src = emp.logo_header_url;
}

// Modales
let _scrollY = 0;
function openModal(id) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.add('open');
  _scrollY = window.scrollY;
  document.body.classList.add('modal-open');
  document.body.style.cssText += `;overflow:hidden;position:fixed;width:100%;top:-${_scrollY}px`;
}

function closeModal(id) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.remove('open');
  if (id === 'modalEvento') { ddClear('evClienteDd'); S._desdeEvento = false; }
  const abiertos = document.querySelectorAll('.modal-backdrop.open');
  if (!abiertos.length) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width    = '';
    document.body.style.top      = '';
    window.scrollTo(0, _scrollY);
  }
}

function ddClear(id) {
  const dd = document.getElementById(id); if (!dd) return;
  dd.innerHTML = ''; dd.classList.remove('open');
}