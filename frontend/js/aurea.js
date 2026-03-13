/* ==========================================
   CONFIG
============================================= */
const API_URL = 'https://partydecor-api-production.up.railway.app/api';

/* ==========================================
   ESTADO
============================================= */
const S = {
  token: null,
  usuario: null,
  empresa: null,
  empresas: [],
  eventos: [],
  eventosFilt: [],
  evExpandido: null,
  filterActivo: 'todos',
  pinBuf: '',
  theme: 'rosa',
  mode: 'dark',
};

/* ==========================================
   API
============================================= */
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (S.token) opts.headers['Authorization'] = 'Bearer ' + S.token;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_URL + path, opts);
  if (res.status === 401) { cerrarSesion(); throw new Error('Sesión expirada'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error ' + res.status);
  }
  return res.json();
}

/* ==========================================
   TEMAS
============================================= */
function setTheme(theme) {
  S.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pd_theme', theme);
  document.querySelectorAll('.theme-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === theme && !el.id.includes('Dark'));
  });
  updateLogo();
}

function setMode(mode) {
  S.mode = mode;
  document.documentElement.setAttribute('data-mode', mode);
  localStorage.setItem('pd_mode', mode);
  document.getElementById('modeLight').classList.toggle('active', mode === 'light');
  document.getElementById('modeDark').classList.toggle('active', mode === 'dark');
  updateLogo();
}

function updateLogo() {
  // Función original: actualiza dinámicamente el logo según tema y empresa
  // Aquí se mantiene la lógica original (simplificada)
  const dark = S.mode === 'dark';
  const gold = S.theme === 'gold';
  // En modo oscuro con tema gold → logo dorado, resto → logo negro con filtro invert
  // En modo claro → logo negro sin filtro
  // Nota: el src real se cargará desde la empresa o se usará el placeholder
  // Por ahora no hacemos cambios adicionales
}

function loadTheme() {
  const t = localStorage.getItem('pd_theme') || 'neutro';
  const m = localStorage.getItem('pd_mode') || 'dark';
  S.theme = t; S.mode = m;
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.setAttribute('data-mode', m);
  document.getElementById('modeLight').classList.toggle('active', m === 'light');
  document.getElementById('modeDark').classList.toggle('active', m === 'dark');
  document.querySelectorAll('.theme-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === t);
  });
  updateLogo();
}

/* ==========================================
   NAVEGACIÓN
============================================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function navTo(sec) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec' + sec.charAt(0).toUpperCase() + sec.slice(1)).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const ni = document.getElementById('nav-' + sec);
  if (ni) ni.classList.add('active');
  document.querySelectorAll('.bnav-item').forEach(n => n.classList.remove('active'));
  const bi = document.getElementById('bnav-' + sec);
  if (bi) bi.classList.add('active');
  closeSidebar();
  const fab = document.getElementById('fabBtn');
  fab.style.display = sec === 'eventos' ? 'flex' : 'none';
}

function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  const open = s.classList.toggle('open');
  o.classList.toggle('visible', open);
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

/* ==========================================
   LOGIN — CONTRASEÑA
============================================= */
function switchLoginTab(tab) {
  const passForm = document.getElementById('loginPassForm');
  const pinForm = document.getElementById('loginPinForm');
  const tabPass = document.getElementById('tabPass');
  const tabPin = document.getElementById('tabPin');
  if (tab === 'pass') {
    passForm.style.display = 'block';
    pinForm.style.display = 'none';
    tabPass.classList.add('active');
    tabPin.classList.remove('active');
  } else {
    passForm.style.display = 'none';
    pinForm.style.display = 'block';
    tabPass.classList.remove('active');
    tabPin.classList.add('active');
    S.pinBuf = '';
    updatePinDots();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('loginPass');
  if (passInput) {
    passInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  }
});

async function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!user || !pass) { toast('Ingresa usuario y contraseña', 'warn'); return; }
  const btn = document.getElementById('btnLogin');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
  try {
    // Intentar login con usuario+contraseña (usando pin como contraseña temporal)
    const res = await api('POST', '/auth/login', { pin: pass, usuario: user });
    S.token = res.token;
    S.usuario = res.usuario;
    localStorage.setItem('pd_token', res.token);
    localStorage.setItem('pd_user', JSON.stringify(res.usuario));
    localStorage.setItem('pd_pin_user', user);
    afterLogin(res.usuario);
  } catch(e) {
    toast(e.message || 'Usuario o contraseña incorrectos', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

function afterLogin(usuario) {
  const empresas = usuario.empresas || [];
  if (empresas.length > 1) {
    S.empresas = empresas;
    mostrarSelectorEmpresa(empresas);
  } else {
    S.empresa = empresas[0] || { nombre: 'Party Decor', tema: 'rosa' };
    entrarApp();
  }
}

/* ==========================================
   SELECTOR EMPRESA
============================================= */
function mostrarSelectorEmpresa(empresas) {
  showScreen('screenEmpresa');
  const list = document.getElementById('empresaList');
  list.innerHTML = empresas.map((e, i) => `
    <div class="empresa-item" onclick="seleccionarEmpresa(${i})">
      <img class="empresa-logo" src="${e.logo || ''}" onerror="this.style.display='none'" alt="">
      <div>
        <div class="empresa-name">${esc(e.nombre)}</div>
        <div class="empresa-rol">${esc(e.rol || 'Usuario')}</div>
      </div>
      <svg class="empresa-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  `).join('');
}

function seleccionarEmpresa(idx) {
  S.empresa = S.empresas[idx];
  entrarApp();
}

/* ==========================================
   ENTRAR A LA APP
============================================= */
function entrarApp() {
  const u = S.usuario || {};
  const emp = S.empresa || {};

  if (emp.tema) setTheme(emp.tema);

  document.getElementById('appEmpresaNombre').textContent = emp.nombre || 'Party Decor';
  document.getElementById('loginEmpresaNombre').textContent = emp.nombre || 'Party Decor';

  if (S.empresas.length > 1) {
    const badge = document.getElementById('appEmpresaBadge');
    badge.textContent = emp.nombre;
    badge.style.display = 'inline-flex';
  }

  const nombre = u.nombre || u.usuario || 'U';
  const iniciales = nombre.split(' ').map(p => p[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('appAvatar').textContent = iniciales;
  document.getElementById('profileAvatar').textContent = iniciales;
  document.getElementById('profileName').textContent = nombre;
  document.getElementById('profileRol').textContent = u.es_admin ? 'Admin' : 'Usuario';

  const esAdmin = u.es_admin || false;
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('visible', esAdmin);
  });

  showScreen('screenApp');
  navTo('eventos');
  cargarEventos();
}

/* ==========================================
   PIN RÁPIDO
============================================= */
function checkPinDisponible() {
  const savedUser = localStorage.getItem('pd_pin_user');
  const savedToken = localStorage.getItem('pd_token');
  if (savedUser && savedToken) {
    document.getElementById('tabPin').style.display = 'block';
    document.getElementById('pinUserName').textContent = savedUser;
  }
}

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    document.getElementById('pd' + i).classList.toggle('filled', i < S.pinBuf.length);
  }
}

function pinPress(d) {
  if (S.pinBuf.length >= 4) return;
  S.pinBuf += d;
  updatePinDots();
  if (S.pinBuf.length === 4) setTimeout(doPinLogin, 120);
}

function pinDel() {
  S.pinBuf = S.pinBuf.slice(0, -1);
  updatePinDots();
}

async function doPinLogin() {
  try {
    const res = await api('POST', '/auth/login', { pin: S.pinBuf });
    S.token = res.token;
    S.usuario = res.usuario;
    localStorage.setItem('pd_token', res.token);
    localStorage.setItem('pd_user', JSON.stringify(res.usuario));
    afterLogin(res.usuario);
  } catch(e) {
    toast('PIN incorrecto', 'error');
    S.pinBuf = '';
    updatePinDots();
  }
}

/* ==========================================
   EVENTOS
============================================= */
async function cargarEventos() {
  try {
    const data = await api('GET', '/eventos');
    S.eventos = (data || []).map(e => ({
      ...e,
      cliente: e.cliente || e.cli || '—',
      fecha: e.fecha || (e.f_ev ? new Date(e.f_ev + 'T12:00:00').toLocaleDateString('es-MX', {day:'numeric',month:'short',year:'numeric'}) : '—'),
      fecha_iso: e.fecha_iso || e.f_ev || '',
    }));
    filtrarEventos();
    cargarClientes();
  } catch(e) {
    document.getElementById('evGrid').innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">Error al cargar eventos</div>`;
    toast('Error: ' + e.message, 'error');
  }
}

function setFilter(f) {
  S.filterActivo = f;
  document.querySelectorAll('.chip[data-filter]').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === f);
  });
  filtrarEventos();
}

function filtrarEventos() {
  const q = (document.getElementById('evSearch')?.value || '').toLowerCase().trim();
  const hoy = new Date().toISOString().split('T')[0];
  let lista = S.eventos.filter(e => {
    if (q) {
      const haystack = `${e.id} ${e.cliente} ${e.tipo || ''} ${e.tel1 || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (S.filterActivo === 'proximos') return e.fecha_iso >= hoy;
    if (S.filterActivo === 'pasados') return e.fecha_iso && e.fecha_iso < hoy;
    if (S.filterActivo === 'pendiente') return e.e_pago !== 'Realizado';
    return true;
  });
  S.eventosFilt = lista;
  renderEventos(lista);
}

function renderEventos(lista) {
  const grid = document.getElementById('evGrid');
  if (!lista.length) {
    grid.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--text3)">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px;opacity:0.4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <p style="font-size:14px">Sin eventos</p></div>`;
    return;
  }
  const hoy = new Date().toISOString().split('T')[0];
  grid.innerHTML = lista.map((ev, idx) => {
    const past = ev.fecha_iso && ev.fecha_iso < hoy;
    const pend = ev.e_pago !== 'Realizado';
    const saldo = Number(ev.saldo) || 0;
    const anticipo = Number(ev.anticipo) || 0;
    const total = Number(ev.total) || 0;
    const exp = S.evExpandido === ev.id;
    return `
    <div class="ev-card${past?' past':''}${exp?' expanded':''}" id="evCard-${ev.id}" onclick="toggleEvento('${ev.id}',${idx})">
      <div class="ev-card-top">
        <div>
          <div class="ev-folio">${esc(ev.id)}</div>
          <div class="ev-name">${esc(ev.cliente)}</div>
          <div class="ev-date">${esc(ev.fecha)}${ev.tipo ? ' · ' + esc(ev.tipo) : ''}</div>
        </div>
        <span class="badge ${pend?'badge-pend':'badge-done'}">${pend?'Pendiente':'Realizado'}</span>
      </div>
      <div class="ev-totals">
        <div class="ev-tot-item"><span class="ev-tot-label">Total</span><span class="ev-tot-val">$${fmt(total)}</span></div>
        <div class="ev-tot-item"><span class="ev-tot-label">Anticipo</span><span class="ev-tot-val">$${fmt(anticipo)}</span></div>
        <div class="ev-tot-item"><span class="ev-tot-label">Saldo</span><span class="ev-tot-val ${saldo>0?'red':'green'}">$${fmt(saldo)}</span></div>
      </div>
      ${exp ? renderEvDetalle(ev) : ''}
    </div>`;
  }).join('');
}

function renderEvDetalle(ev) {
  const items = ev._items || [];
  const hist = ev._historial || [];
  return `
  <div class="ev-detail" onclick="event.stopPropagation()">
    ${items.length ? `
    <div>
      <div class="detail-section-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        Items cotizados
      </div>
      ${items.map(it => `
        <div class="item-row">
          <div>
            <div class="item-name${it.nombre_custom?' renamed':''}">${esc(it.nombre_custom||it.item||it.nombre)}</div>
            <div class="item-qty">× ${it.cantidad}</div>
          </div>
          <div class="item-price">$${fmt(it.total||it.precio*it.cantidad)}</div>
        </div>`).join('')}
    </div>` : `<div style="color:var(--text3);font-size:12px;text-align:center;padding:10px 0">Cargando items…</div>`}

    ${ev.obs ? `
    <div>
      <div class="detail-section-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Nota interna
      </div>
      <div class="note-box">${esc(ev.obs)}</div>
    </div>` : ''}

    ${hist.length ? `
    <div>
      <div class="detail-section-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Historial
      </div>
      ${hist.slice(0,4).map(h => `
        <div class="history-row">
          <div class="history-avatar">${(h.usuario||'?')[0].toUpperCase()}</div>
          <div class="history-text"><strong>${esc(h.usuario)}</strong> ${esc(h.descripcion)} <span style="color:var(--text3)">· ${formatFechaHist(h.fecha)}</span></div>
        </div>`).join('')}
    </div>` : ''}

    <div class="ev-actions">
      <button class="btn btn-accent btn-sm" onclick="abrirCotizacion('${ev.id}')">Editar cotización</button>
      <button class="btn btn-ghost btn-sm" onclick="generarPDF('${ev.id}')">PDF</button>
    </div>
  </div>`;
}

async function toggleEvento(id, idx) {
  if (S.evExpandido === id) {
    S.evExpandido = null;
    renderEventos(S.eventosFilt);
    return;
  }
  S.evExpandido = id;
  const ev = S.eventosFilt[idx];
  renderEventos(S.eventosFilt);
  if (!ev._items) {
    try {
      const items = await api('GET', '/items/' + id);
      ev._items = items || [];
      ev._historial = [
        { usuario: ev.creado_por || 'Sistema', descripcion: 'Evento creado', fecha: ev.created_at || ev.fecha_iso }
      ];
      renderEventos(S.eventosFilt);
    } catch(e) {
      ev._items = [];
    }
  }
}

function abrirCotizacion(id) {
  toast('Abriendo cotización ' + id + '…', 'ok');
  // TODO: abrir modal cotización
}

async function generarPDF(id) {
  if (!id && S.eventoActual) id = S.eventoActual.id;
  if (!id) {
    toast('Selecciona un evento primero', 'warn');
    return;
  }
  const btn = document.getElementById('btnPdf');
  const txt = document.getElementById('pdfTxt');
  if (btn) {
    btn.disabled = true;
    txt.innerHTML = '<span class="spinner"></span> Generando…';
  }
  try {
    const res = await api('POST', '/pdf/' + id, {
      iva: S.eventoActual?.iva || 'No aplica',
      isr: S.eventoActual?.isr || 'No aplica'
    });
    if (res.url) {
      if (S.eventoActual) S.eventoActual.pdf_url = res.url;
      const linkWrap = document.getElementById('pdfLinkWrap');
      const pdfLink = document.getElementById('pdfLink');
      if (linkWrap && pdfLink) {
        pdfLink.href = res.url;
        linkWrap.style.display = 'block';
      }
      toast('PDF generado correctamente', 'ok');
    }
  } catch(e) {
    toast('Error al generar PDF: ' + e.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      txt.textContent = 'Generar cotización PDF';
    }
  }
}

/* ==========================================
   CLIENTES
============================================= */
async function cargarClientes() {
  try {
    const data = await api('GET', '/clientes');
    S.clientes = data || [];
    renderClientes();
  } catch(e) {
    toast('Error al cargar clientes: ' + e.message, 'error');
  }
}

function renderClientes() {
  const container = document.getElementById('clientesGrid');
  if (!container) return;
  if (!S.clientes.length) {
    container.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text3)">No hay clientes registrados</div>`;
    return;
  }
  container.innerHTML = S.clientes.map(c => `
    <div class="cliente-card">
      <div class="cliente-nombre">${esc(c.nombre)}</div>
      <div class="cliente-telefono">📞 ${esc(c.tel1)}${c.tel2 ? ' · ' + esc(c.tel2) : ''}</div>
      ${c.dir ? `<div style="font-size:11px;color:var(--text3);margin-top:4px">📍 ${esc(c.dir)}</div>` : ''}
      <div class="cliente-meta">
        <span class="cliente-tipo">${esc(c.tipo || 'Particular')}</span>
        <span class="cliente-fuente">${esc(c.fuente || 'Sin datos')}</span>
      </div>
      <div class="cliente-actions">
        <button class="btn btn-ghost btn-sm" onclick="editarCliente('${c.id}')">✎ Editar</button>
        <button class="btn btn-ghost btn-sm" onclick="verEventosCliente('${c.id}')">📋 Eventos</button>
      </div>
    </div>
  `).join('');
}

function editarCliente(id) {
  const c = S.clientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('editClienteId').value = c.id;
  document.getElementById('editClienteNombre').value = c.nombre;
  document.getElementById('editClienteTel1').value = c.tel1 || '';
  document.getElementById('editClienteTel2').value = c.tel2 || '';
  document.getElementById('editClienteTipo').value = c.tipo || 'Particular';
  document.getElementById('editClienteFuente').value = c.fuente || 'Sin datos';
  document.getElementById('editClienteDir').value = c.dir || '';
  openModal('modalCliente');
}

async function guardarCliente() {
  const id = document.getElementById('editClienteId').value;
  const datos = {
    nombre: document.getElementById('editClienteNombre').value.trim(),
    tel1: document.getElementById('editClienteTel1').value.trim(),
    tel2: document.getElementById('editClienteTel2').value.trim(),
    tipo: document.getElementById('editClienteTipo').value,
    fuente: document.getElementById('editClienteFuente').value,
    dir: document.getElementById('editClienteDir').value.trim(),
  };
  if (!datos.nombre || !datos.tel1) {
    toast('Nombre y teléfono principal son obligatorios', 'warn');
    return;
  }
  try {
    if (id) {
      await api('PATCH', '/clientes/' + id, datos);
      toast('Cliente actualizado', 'ok');
    } else {
      await api('POST', '/clientes', datos);
      toast('Cliente creado', 'ok');
    }
    closeModal('modalCliente');
    cargarClientes();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
}

function abrirNuevoCliente() {
  document.getElementById('editClienteId').value = '';
  document.getElementById('editClienteNombre').value = '';
  document.getElementById('editClienteTel1').value = '';
  document.getElementById('editClienteTel2').value = '';
  document.getElementById('editClienteTipo').value = 'Particular';
  document.getElementById('editClienteFuente').value = 'Sin datos';
  document.getElementById('editClienteDir').value = '';
  openModal('modalCliente');
}

function verEventosCliente(id) {
  navTo('eventos');
  document.getElementById('evSearch').value = '';
  toast('Función en desarrollo', 'warn');
}

/* ==========================================
   CERRAR SESIÓN
============================================= */
function cerrarSesion() {
  S.token = null; S.usuario = null; S.empresa = null;
  localStorage.removeItem('pd_token');
  localStorage.removeItem('pd_user');
  showScreen('screenLogin');
  switchLoginTab('pass');
  checkPinDisponible();
}

/* ==========================================
   UTILIDADES
============================================= */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(n) {
  return Number(n||0).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function formatFechaHist(f) {
  if (!f) return '';
  try {
    return new Date(f).toLocaleDateString('es-MX', {day:'numeric',month:'short',year:'numeric'});
  } catch { return f; }
}

function toast(msg, type='') {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

/* ==========================================
   INIT
============================================= */
function init() {
  loadTheme();
  checkPinDisponible();
  const savedToken = localStorage.getItem('pd_token');
  const savedUser = localStorage.getItem('pd_user');
  if (savedToken && savedUser) {
    try {
      S.token = savedToken;
      S.usuario = JSON.parse(savedUser);
      S.empresa = S.usuario.empresas?.[0] || { nombre: 'Party Decor', tema: 'rosa' };
      entrarApp();
    } catch { cerrarSesion(); }
  }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);