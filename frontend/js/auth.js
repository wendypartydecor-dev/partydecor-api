// js/auth.js — Autenticación y login
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
  S.esAdmin = res.usuario?.es_admin || false;
  S.rol = res.usuario?.rol || 'usuario';
  
  if (res.token_temp) {
    localStorage.setItem('pd_token_temp', res.token_temp);
    S.empresas = res.empresas;
    mostrarSelectorEmpresa(S.empresas);
  } else {
    S.token = res.token;
    localStorage.setItem('pd_token', res.token);
    localStorage.setItem('pd_user', JSON.stringify(res.usuario));
    if (res.empresa) { 
      localStorage.setItem('pd_empresa', JSON.stringify(res.empresa)); 
      S.empresa = res.empresa; 
    }
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
    const res = await fetch(CONFIG.API_URL+'/auth/seleccionar', {
      method:'POST', 
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+tokenTemp},
      body: JSON.stringify({empresa_id:empresa.id_empresa})
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error||'Error al seleccionar empresa'); }
    const data = await res.json();
    S.token = data.token; 
    S.empresa = {...empresa,...data.empresa};
    S.rol_empresa = data.empresa?.rol || null;
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
  document.getElementById('profileRol').textContent    = getRolDisplay(u);
  
  const mostrarAdmin = S.rol === 'super_admin' || S.rol === 'admin' || S.rol_empresa === 'admin';
  console.log('Rol detectado:', S.rol, 'esAdmin:', S.esAdmin, 'mostrarAdmin:', mostrarAdmin);
  if (mostrarAdmin) toast('Admin habilitado', 'ok');
  document.querySelectorAll('.nav-item.admin-only').forEach(el => {
    el.classList.toggle('visible', mostrarAdmin);
  });
  
  showScreen('screenApp'); navTo('eventos');
  cargarEventos(); cargarClientes();
}

function cerrarSesion() {
  S.token=null; S.usuario=null; S.empresa=null; S.esAdmin=false; S.rol=null; S.rol_empresa=null;
  ['pd_token','pd_user','pd_empresa','pd_token_temp'].forEach(k => localStorage.removeItem(k));
  showScreen('screenLogin'); switchLoginTab('pass');
}

async function guardarPin() {
  const pin = document.getElementById('nuevoPin').value;
  if (!pin || pin.length < 4 || pin.length > 8) {
    toast('El PIN debe tener entre 4 y 8 dígitos', 'warn');
    return;
  }
  try {
    await api('PATCH', '/auth/metodo-login', { metodo: 'pin', nuevo_pin: pin });
    toast('PIN actualizado', 'ok');
    closeModal('modalCambiarPin');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

async function guardarMetodoLogin() {
  const metodo = document.getElementById('metodoLoginSelect').value;
  try {
    await api('PATCH', '/auth/metodo-login', { metodo });
    toast('Método actualizado', 'ok');
    closeModal('modalMetodoLogin');
    if (metodo === 'pin') {
      switchLoginTab('pin');
    } else {
      switchLoginTab('pass');
    }
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}