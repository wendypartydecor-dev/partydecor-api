/* ==========================================
   CONFIG
============================================= */
const API_URL = 'https://partydecor-api-production.up.railway.app/api';

/* ==========================================
   ESTADO GLOBAL
============================================= */
const S = {
  token: null, usuario: null, empresa: null,
  empresas: [], eventos: [], eventosFilt: [], clientes: [],
  evExpandido: null, filterActivo: 'todos', pinBuf: '',
  theme: localStorage.getItem('pd_theme') || 'neutro',
  mode:  localStorage.getItem('pd_mode')  || 'dark',
  clienteEditId: null,
  _desdeEvento: false   // true cuando "+" del modal evento abre modal cliente
};

/* ==========================================
   API
============================================= */
async function api(method, path, body, useToken = true) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (useToken && S.token) opts.headers['Authorization'] = 'Bearer ' + S.token;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_URL + path, opts);
  if (res.status === 401) { if (path !== '/auth/login') cerrarSesion(); throw new Error('Sesión expirada'); }
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || 'Error ' + res.status); }
  return res.json();
}

/* ==========================================
   TEMAS
============================================= */
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

/* ==========================================
   NAVEGACIÓN
============================================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
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

/* ==========================================
   LOGIN
============================================= */
function switchLoginTab(tab) {
  const p = document.getElementById('loginFormPass'), n = document.getElementById('loginFormPin');
  if (tab === 'pass') { p.style.display = 'flex'; n.style.display = 'none'; }
  else { p.style.display = 'none'; n.style.display = 'flex'; S.pinBuf = ''; updatePinDots(); }
}
function updatePinDots() {
  for (let i = 0; i < 4; i++) document.getElementById('pd' + i)?.classList.toggle('filled', i < S.pinBuf.length);
}
function pinPress(d) {
  if (S.pinBuf.length >= 4) return;
  S.pinBuf += d; updatePinDots();
  if (S.pinBuf.length === 4) setTimeout(doPinLogin, 120);
}
function pinDel() { S.pinBuf = S.pinBuf.slice(0,-1); updatePinDots(); }
async function doPinLogin() {
  try { procesarLogin(await api('POST','/auth/login',{pin:S.pinBuf},false)); }
  catch(e) { toast('PIN incorrecto','error'); S.pinBuf=''; updatePinDots(); }
}
async function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!user || !pass) { toast('Ingresa usuario y contraseña','warn'); return; }
  const btn = document.getElementById('btnLogin');
  btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
  try { procesarLogin(await api('POST','/auth/login',{password:pass,usuario:user},false)); }
  catch(e) { toast(e.message||'Usuario o contraseña incorrectos','error'); }
  finally { btn.disabled = false; btn.textContent = 'Entrar'; }
}
function procesarLogin(res) {
  S.usuario = res.usuario;
  if (res.token_temp) {
    localStorage.setItem('pd_token_temp', res.token_temp);
    S.empresas = res.empresas;
    mostrarSelectorEmpresa(S.empresas);
  } else {
    S.token = res.token;
    localStorage.setItem('pd_token', res.token);
    localStorage.setItem('pd_user', JSON.stringify(res.usuario));
    if (res.empresa) { localStorage.setItem('pd_empresa', JSON.stringify(res.empresa)); S.empresa = res.empresa; }
    afterLogin();
  }
}
function mostrarSelectorEmpresa(empresas) {
  showScreen('screenEmpresa');
  document.getElementById('empresaList').innerHTML = empresas.map((e,i) => {
    const ini = (e.empresa||e.nombre||'?')[0].toUpperCase();
    const logoHtml = e.logo_login_url
      ? `<img class="empresa-logo" src="${esc(e.logo_login_url)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="">
         <div class="empresa-logo-placeholder" style="display:none">${ini}</div>`
      : `<div class="empresa-logo-placeholder">${ini}</div>`;
    return `<div class="empresa-item" onclick="seleccionarEmpresa(${i})">
      ${logoHtml}
      <div class="empresa-info"><div class="empresa-nombre">${esc(e.empresa||e.nombre||'')}</div><div class="empresa-rol">${esc(e.rol||'Usuario')}</div></div>
      <svg class="empresa-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
  }).join('');
}
async function seleccionarEmpresa(idx) {
  const empresa = S.empresas[idx]; if (!empresa) return;
  try {
    const tokenTemp = localStorage.getItem('pd_token_temp');
    const res = await fetch(API_URL+'/auth/seleccionar', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+tokenTemp},
      body: JSON.stringify({empresa_id:empresa.id_empresa})
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error||'Error al seleccionar empresa'); }
    const data = await res.json();
    S.token = data.token; S.empresa = {...empresa,...data.empresa};
    localStorage.setItem('pd_token', data.token);
    localStorage.setItem('pd_empresa', JSON.stringify(S.empresa));
    localStorage.removeItem('pd_token_temp');
    afterLogin();
  } catch(e) { toast(e.message||'Error al entrar','error'); }
}
function afterLogin() {
  const u = S.usuario||{}, emp = S.empresa||{};
  const temaUsuario = localStorage.getItem('pd_theme');
  if (temaUsuario) {
    setTheme(temaUsuario);
  } else if (emp.tema_default) {
    setTheme(emp.tema_default);
  }
  document.getElementById('appEmpresaNombre').textContent   = emp.empresa||emp.nombre||'Party Decor';
  document.getElementById('loginEmpresaNombre').textContent = emp.empresa||emp.nombre||'Party Decor';
  actualizarLogos();
  const ini = (u.nombre||'U').split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('appAvatar').textContent     = ini;
  document.getElementById('profileAvatar').textContent = ini;
  document.getElementById('profileName').textContent   = u.nombre||'';
  document.getElementById('profileRol').textContent    = u.es_admin ? 'Admin' : 'Usuario';
  document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('visible', !!u.es_admin));
  showScreen('screenApp'); navTo('eventos');
  cargarEventos(); cargarClientes();
}
function cerrarSesion() {
  S.token=null; S.usuario=null; S.empresa=null;
  ['pd_token','pd_user','pd_empresa','pd_token_temp'].forEach(k => localStorage.removeItem(k));
  showScreen('screenLogin'); switchLoginTab('pass');
}

/* ==========================================
   MODALES  — scroll completamente bloqueado
============================================= */
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

/* ==========================================
   DROPDOWN HELPER
============================================= */
function ddClear(id) {
  const dd = document.getElementById(id); if (!dd) return;
  dd.innerHTML = ''; dd.classList.remove('open');
}

/* ==========================================
   CLIENTES
============================================= */
async function cargarClientes() {
  try { const res = await api('GET','/clientes'); S.clientes = (res?.data)||[]; renderClientes(); }
  catch(e) { toast('Error al cargar clientes: '+e.message,'error'); }
}
function renderClientes() {
  const c = document.getElementById('clientesGrid'); if (!c) return;
  if (!S.clientes.length) { c.innerHTML='<div class="empty-message">No hay clientes registrados</div>'; return; }
  c.innerHTML = S.clientes.map(x => clienteCard(x)).join('');
}
function filtrarClientes() {
  const q = document.getElementById('cliSearch')?.value.toLowerCase().trim()||'';
  const c = document.getElementById('clientesGrid'); if (!c) return;
  const list = q ? S.clientes.filter(x => x.nombre.toLowerCase().includes(q)||(x.tel1||'').includes(q)) : S.clientes;
  if (!list.length) { c.innerHTML='<div class="empty-message">Sin resultados</div>'; return; }
  c.innerHTML = list.map(x => clienteCard(x)).join('');
}
function clienteCard(c) {
  return `<div class="cliente-card">
    <div class="cliente-nombre">${esc(c.nombre)}</div>
    <div class="cliente-telefono">📞 ${esc(c.tel1)}${c.tel2?' · '+esc(c.tel2):''}</div>
    ${c.dir?`<div style="font-size:11px;color:var(--text3);margin-top:4px">📍 ${esc(c.dir)}</div>`:''}
    <div class="cliente-meta">
      <span class="cliente-tipo">${esc(c.tipo||'Particular')}</span>
      <span class="cliente-fuente">${esc(c.fuente||'Sin datos')}</span>
    </div>
    <div class="cliente-actions">
      <button class="btn btn-ghost btn-sm" onclick="editarCliente('${c.id}')">✎ Editar</button>
      <button class="btn btn-ghost btn-sm" onclick="verEventosCliente('${c.id}')">📋 Eventos</button>
    </div>
  </div>`;
}
function abrirNuevoCliente() {
  S.clienteEditId = null;
  document.getElementById('modalClienteTitle').textContent = 'Nuevo cliente';
  ['editClienteId','editClienteNombre','editClienteTel1','editClienteTel2','editClienteDir']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('editClienteTipo').value   = 'Particular';
  document.getElementById('editClienteFuente').value = 'Sin datos';
  openModal('modalCliente');
}
function editarCliente(id) {
  const c = S.clientes.find(x=>x.id===id); if (!c) return;
  S.clienteEditId = id;
  document.getElementById('modalClienteTitle').textContent = 'Editar cliente';
  document.getElementById('editClienteId').value    = c.id;
  document.getElementById('editClienteNombre').value = c.nombre;
  document.getElementById('editClienteTel1').value   = c.tel1||'';
  document.getElementById('editClienteTel2').value   = c.tel2||'';
  document.getElementById('editClienteTipo').value   = c.tipo||'Particular';
  document.getElementById('editClienteFuente').value = c.fuente||'Sin datos';
  document.getElementById('editClienteDir').value    = c.dir||'';
  openModal('modalCliente');
}
async function guardarCliente() {
  const id = document.getElementById('editClienteId').value;
  const datos = {
    nombre: document.getElementById('editClienteNombre').value.trim(),
    tel1:   document.getElementById('editClienteTel1').value.trim(),
    tel2:   document.getElementById('editClienteTel2').value.trim(),
    tipo:   document.getElementById('editClienteTipo').value,
    fuente: document.getElementById('editClienteFuente').value,
    dir:    document.getElementById('editClienteDir').value.trim(),
  };
  if (!datos.nombre||!datos.tel1) { toast('Nombre y teléfono son obligatorios','warn'); return; }
  try {
    let saved;
    if (id) { saved = await api('PATCH','/clientes/'+id,datos); toast('Cliente actualizado','ok'); }
    else    { saved = await api('POST', '/clientes',      datos); toast('Cliente creado','ok'); }
    closeModal('modalCliente');
    await cargarClientes();

    // Auto-selección en modal de eventos
    if (S._desdeEvento) {
      S._desdeEvento = false;
      const nuevo = S.clientes.find(c => c.nombre===datos.nombre && c.tel1===datos.tel1)
                 || (saved?.id && S.clientes.find(c=>c.id===saved.id));
      if (nuevo) {
        document.getElementById('evClienteId').value     = nuevo.id;
        document.getElementById('evClienteSearch').value = nuevo.nombre;
        const inf = document.getElementById('evClienteInfo');
        if (inf) { inf.textContent = '✓ '+nuevo.nombre; inf.style.display = 'block'; }
      }
      openModal('modalEvento');
    }
  } catch(e) { toast('Error: '+e.message,'error'); }
}
function verEventosCliente(id) { navTo('eventos'); }

// Abrir modal de cliente DESDE el modal de eventos
function abrirNuevoClienteDesdeEvento() {
  S._desdeEvento = true;
  const q = document.getElementById('evClienteSearch')?.value.trim()||'';
  ddClear('evClienteDd');
  abrirNuevoCliente();
  if (q) document.getElementById('editClienteNombre').value = q;
}

/* ==========================================
   EVENTOS
============================================= */
async function cargarEventos() {
  try {
    const res = await api('GET','/eventos');
    const data = (res?.data)||[];
    S.eventos = data.map(e => ({
      ...e,
      cliente:   e.cliente||e.cli||'—',
      fecha:     e.f_ev ? new Date(e.f_ev+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}) : '—',
      fecha_iso: e.f_ev||'',
    }));
    filtrarEventos();
  } catch(e) {
    document.getElementById('evGrid').innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">Error al cargar eventos</div>`;
    toast('Error: '+e.message,'error');
  }
}
function setFilter(f) {
  S.filterActivo = f;
  document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.toggle('active', c.dataset.filter===f));
  filtrarEventos();
}
function filtrarEventos() {
  const q   = (document.getElementById('evSearch')?.value||'').toLowerCase().trim();
  const hoy = new Date().toISOString().split('T')[0];
  const lista = S.eventos.filter(e => {
    if (q && !`${e.id} ${e.cliente} ${e.tipo||''}`.toLowerCase().includes(q)) return false;
    if (S.filterActivo==='proximos') return e.fecha_iso >= hoy;
    if (S.filterActivo==='pasados')  return e.fecha_iso && e.fecha_iso < hoy;
    if (S.filterActivo==='pendiente') return e.e_pago !== 'Realizado';
    return true;
  });
  S.eventosFilt = lista; renderEventos(lista);
}
function renderEventos(lista) {
  const grid = document.getElementById('evGrid');
  if (!lista.length) { grid.innerHTML=`<div class="empty-message">No hay eventos</div>`; return; }
  const hoy = new Date().toISOString().split('T')[0];
  grid.innerHTML = lista.map(ev => {
    const past=ev.fecha_iso&&ev.fecha_iso<hoy, pend=ev.e_pago!=='Realizado';
    const saldo=Number(ev.saldo)||0, anticipo=Number(ev.anticipo)||0, total=Number(ev.total)||0;
    const exp=S.evExpandido===ev.id;
    return `<div class="ev-card${past?' past':''}${exp?' expanded':''}" data-id="${ev.id}">
      <div class="ev-card-top" onclick="toggleEvento('${ev.id}')">
        <div>
          <div class="ev-folio">${esc(ev.id)}</div>
          <div class="ev-name">${esc(ev.cliente)}</div>
          <div class="ev-date">📅 ${esc(ev.fecha)}${ev.tipo?' · '+esc(ev.tipo):''}</div>
        </div>
        <span class="ev-badge${pend?'':' realizado'}">${pend?'Pendiente':'Realizado'}</span>
      </div>
      <div class="ev-stats">
        <div class="ev-stat-item"><div class="ev-stat-label">Total</div><div class="ev-stat-value">$${fmt(total)}</div></div>
        <div class="ev-stat-item"><div class="ev-stat-label">Anticipo</div><div class="ev-stat-value">$${fmt(anticipo)}</div></div>
        <div class="ev-stat-item"><div class="ev-stat-label">Saldo</div><div class="ev-stat-value saldo${saldo===0?' zero':''}">$${fmt(saldo)}</div></div>
      </div>
      <div class="ev-actions">
        <button class="ev-action-btn" onclick="abrirEditarEvento('${ev.id}')">✎ Editar</button>
        <button class="ev-action-btn" onclick="generarPDF('${ev.id}')">📄 PDF</button>
        <button class="ev-action-btn${pend?'':' danger'}" onclick="togglePagoEvento('${ev.id}','${pend?'Realizado':'Pendiente'}')">
          ${pend?'✓ Marcar pagado':'↻ Marcar pendiente'}
        </button>
      </div>
      ${exp?renderEvDetalle(ev):''}
    </div>`;
  }).join('');
}
async function togglePagoEvento(id, nuevoEstado) {
  try {
    await api('PATCH','/eventos/'+id,{e_pago:nuevoEstado});
    const ev = S.eventos.find(e=>e.id===id); if (ev) ev.e_pago = nuevoEstado;
    filtrarEventos(); toast(`Pago: ${nuevoEstado}`,'ok');
  } catch(e) { toast('Error al actualizar pago','error'); }
}
async function toggleEvento(id) {
  if (S.evExpandido===id) { S.evExpandido=null; renderEventos(S.eventosFilt); return; }
  S.evExpandido = id;
  const ev = S.eventosFilt.find(e=>e.id===id);
  renderEventos(S.eventosFilt);
  if (ev && !ev._items) {
    try {
      ev._items    = await api('GET','/items/'+id)||[];
      ev._historial = [{usuario:ev.creado_por||'Sistema',descripcion:'Evento creado',fecha:ev.created_at||ev.fecha_iso}];
      renderEventos(S.eventosFilt);
    } catch(e) { ev._items=[]; }
  }
}
function renderEvDetalle(ev) {
  const items=ev._items||[], hist=ev._historial||[];
  return `<div class="ev-detail" onclick="event.stopPropagation()">
    ${items.length?`<div><div class="detail-section-label">Items</div>${items.map(it=>`
      <div class="item-row">
        <div><div class="item-name${it.nombre_custom?' renamed':''}">${esc(it.nombre_custom||it.item||it.nombre)}</div><div class="item-qty">× ${it.cantidad}</div></div>
        <div class="item-price">$${fmt(it.total||it.precio*it.cantidad)}</div>
      </div>`).join('')}</div>`
    :`<div style="color:var(--text3);font-size:12px;text-align:center;padding:10px 0">Sin items</div>`}
    ${ev.obs?`<div><div class="detail-section-label">Nota</div><div class="note-box">${esc(ev.obs)}</div></div>`:''}
    ${hist.length?`<div><div class="detail-section-label">Historial</div>${hist.slice(0,3).map(h=>`
      <div class="history-row">
        <div class="history-avatar">${(h.usuario||'?')[0].toUpperCase()}</div>
        <div class="history-text"><strong>${esc(h.usuario)}</strong> ${esc(h.descripcion)} <span style="color:var(--text3)">· ${formatFechaHist(h.fecha)}</span></div>
      </div>`).join('')}</div>`:''}
    <div class="ev-actions">
      <button class="btn btn-accent btn-sm" onclick="abrirCotizacion('${ev.id}')">Editar cotización</button>
      <button class="btn btn-ghost btn-sm"  onclick="generarPDF('${ev.id}')">PDF</button>
    </div>
  </div>`;
}
function abrirCotizacion(id) { toast('Abriendo cotización '+id+'…','ok'); }
async function generarPDF(id) {
  if (!id) { toast('Selecciona un evento','warn'); return; }
  try {
    const res = await api('POST','/pdf/'+id,{iva:'No aplica',isr:'No aplica'});
    if (res.url) { toast('PDF generado','ok'); window.open(res.url,'_blank'); }
  } catch(e) { toast('Error al generar PDF: '+e.message,'error'); }
}

/* ── Modal evento ───────────────────────────────────────────── */
function resetModalEvento() {
  ['editEventoId','evClienteId','evClienteSearch','evClienteTel1','evFecha','evDir','evObs','evAnticipo']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const inf = document.getElementById('evClienteInfo');
  if (inf) { inf.textContent=''; inf.style.display='none'; }
  document.getElementById('evTipo').value   = 'No especificado';
  document.getElementById('evEstado').value = 'Borrador';
  document.getElementById('evEPago').value  = 'Pendiente';
  document.getElementById('evIva').value    = 'No aplica';
  document.getElementById('evIsr').value    = 'No aplica';
  ddClear('evClienteDd');
}
function abrirNuevoEvento() {
  S.eventoEditId = null;
  document.getElementById('modalEventoTitle').textContent = 'Nuevo evento';
  resetModalEvento();
  openModal('modalEvento');
}
async function abrirEditarEvento(id) {
  try {
    const ev = await api('GET','/eventos/'+id);
    S.eventoEditId = id;
    resetModalEvento();
    document.getElementById('modalEventoTitle').textContent = 'Editar evento';
    document.getElementById('editEventoId').value    = id;
    document.getElementById('evClienteId').value     = ev.id_cli||'';
    document.getElementById('evClienteSearch').value = ev.cli||'';
    if (ev.cli) {
      const inf = document.getElementById('evClienteInfo');
      if (inf) { inf.textContent='✓ '+ev.cli; inf.style.display='block'; }
    }
    document.getElementById('evFecha').value   = ev.f_ev   ||'';
    document.getElementById('evTipo').value    = ev.tipo   ||'No especificado';
    document.getElementById('evDir').value     = ev.dir    ||'';
    document.getElementById('evObs').value     = ev.obs    ||'';
    document.getElementById('evEstado').value  = ev.estado ||'Borrador';
    document.getElementById('evEPago').value   = ev.e_pago ||'Pendiente';
    document.getElementById('evIva').value     = ev.iva    ||'No aplica';
    document.getElementById('evIsr').value     = ev.isr    ||'No aplica';
    document.getElementById('evAnticipo').value = ev.anticipo||'';
    openModal('modalEvento');
  } catch(e) { toast('Error al cargar evento','error'); }
}

/* ── Búsqueda cliente en modal evento ─────────────────────── */
function buscarClienteParaEvento() {
  const q  = document.getElementById('evClienteSearch').value.trim().toLowerCase();
  const dd = document.getElementById('evClienteDd');
  // Limpiar selección al tipear
  document.getElementById('evClienteId').value = '';
  const inf = document.getElementById('evClienteInfo');
  if (inf) inf.style.display = 'none';

  if (!q) { ddClear('evClienteDd'); return; }

  const res = S.clientes.filter(c =>
    c.nombre.toLowerCase().includes(q)||(c.tel1||'').includes(q)
  ).slice(0,6);

  if (!res.length) {
    dd.innerHTML = `<div class="empty-dd">Sin resultados — usa "+ Nuevo" para crear.</div>`;
    dd.classList.add('open'); return;
  }
  dd.innerHTML = res.map(c => `
    <div class="ddi" onmousedown="seleccionarClienteParaEvento('${c.id}','${esc(c.nombre)}','${esc(c.tel1||'')}')">
      <div class="ddi-name">${esc(c.nombre)}</div>
      <div class="ddi-meta">${esc(c.tel1)}</div>
    </div>`).join('');
  dd.classList.add('open');
}
function seleccionarClienteParaEvento(id, nombre, tel1) {
  document.getElementById('evClienteId').value     = id;
  document.getElementById('evClienteSearch').value = nombre;
  document.getElementById('evClienteTel1').value = tel1 || '';
  const inf = document.getElementById('evClienteInfo');
  if (inf) { inf.textContent='✓ '+nombre; inf.style.display='block'; }
  ddClear('evClienteDd');
}

/* ── Guardar evento ─────────────────────────────────────────── */
async function guardarEvento() {
  const id        = document.getElementById('editEventoId').value;
  const clienteId = document.getElementById('evClienteId').value.trim();
  const clienteTel1 = document.getElementById('evClienteTel1').value.trim();
  const clienteNombre = document.getElementById('evClienteSearch').value.trim();
  const fecha     = document.getElementById('evFecha').value;

  if (!clienteId) {
    toast('Selecciona un cliente (o créalo con "+ Nuevo")', 'warn'); return;
  }
  if (!fecha) { toast('La fecha del evento es obligatoria','warn'); return; }

  const datos = {
    id_cliente: clienteId,
    nombre: clienteNombre,
    tel1: clienteTel1,
    fecha,
    tipo:     document.getElementById('evTipo').value,
    dir:      document.getElementById('evDir').value.trim(),
    obs:      document.getElementById('evObs').value.trim(),
    estado:   document.getElementById('evEstado').value,
    e_pago:   document.getElementById('evEPago').value,
    iva:      document.getElementById('evIva').value,
    isr:      document.getElementById('evIsr').value,
    anticipo: parseFloat(document.getElementById('evAnticipo').value)||0,
  };
  try {
    if (id) { await api('PATCH','/eventos/'+id,datos); toast('Evento actualizado','ok'); }
    else    { await api('POST', '/eventos',     datos); toast('Evento creado','ok');     }
    closeModal('modalEvento');
    cargarEventos();
  } catch(e) { toast('Error: '+e.message,'error'); }
}

/* ==========================================
   UTILIDADES
============================================= */
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
  t.className = 'toast'+(type?' '+type:''); t.textContent = msg;
  w.appendChild(t); setTimeout(()=>t.remove(), 2800);
}

/* ==========================================
   INIT + EVENTOS GLOBALES
============================================= */

// Cerrar dropdown al hacer mousedown fuera (mousedown = antes del focus, evita que se reactive)
document.addEventListener('mousedown', e => {
  const dd    = document.getElementById('evClienteDd');
  const input = document.getElementById('evClienteSearch');
  if (dd && dd.classList.contains('open') && !dd.contains(e.target) && e.target !== input) {
    ddClear('evClienteDd');
  }
});

// Escape cierra el modal más reciente
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const abiertos = [...document.querySelectorAll('.modal-backdrop.open')];
  if (abiertos.length) closeModal(abiertos[abiertos.length-1].id);
});

// Prevenir scroll de la página DETRÁS del modal (touch devices)
document.addEventListener('touchmove', e => {
  if (document.body.classList.contains('modal-open')) {
    // Permitir scroll dentro del modal, bloquear fuera
    const modal = e.target.closest('.modal');
    if (!modal) e.preventDefault();
  }
}, { passive: false });

function init() {
  loadTheme();
  const savedToken   = localStorage.getItem('pd_token');
  const savedUser    = localStorage.getItem('pd_user');
  const savedEmpresa = localStorage.getItem('pd_empresa');
  if (savedToken && savedUser) {
    try {
      S.token = savedToken;
      S.usuario = JSON.parse(savedUser);
      if (savedEmpresa) S.empresa = JSON.parse(savedEmpresa);
      afterLogin();
    } catch { cerrarSesion(); }
  }
}

document.addEventListener('DOMContentLoaded', init);