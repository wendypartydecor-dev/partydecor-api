// js/admin.js — Panel de Administración
let adminTabActivo = 'usuarios';

function openAdminPanel() {
  showScreen('screenAdmin');
  renderAdminUsuarios();
}

function renderAdminUsuarios() {
  adminTabActivo = 'usuarios';
  document.getElementById('adminTabs')?.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'usuarios'));
  cargarAdminUsuarios();
}

function renderAdminEmpresas() {
  adminTabActivo = 'empresas';
  document.getElementById('adminTabs')?.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'empresas'));
  cargarAdminEmpresas();
}

async function cargarAdminUsuarios() {
  try {
    const usuarios = await adminApi('GET','/usuarios');
    renderAdminUsuariosList(usuarios);
  } catch(e) {
    toast('Error al cargar usuarios: '+e.message,'error');
  }
}

function renderAdminUsuariosList(usuarios) {
  const container = document.getElementById('adminContent');
  if (!container) return;
  
  container.innerHTML = `
    <div class="admin-header">
      <h2>Usuarios</h2>
      <button class="btn btn-primary" onclick="openModal('modalAdminUsuario')">+ Nuevo Usuario</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(u => `
            <tr>
              <td>${esc(u.nombre)}</td>
              <td>${esc(u.email||'—')}</td>
              <td>${esc(u.telefono||'—')}</td>
              <td><span class="badge">${ROLES[u.rol]||u.rol}</span></td>
              <td><span class="badge ${u.activo?'ok':'error'}">${u.activo?'Activo':'Inactivo'}</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="editarAdminUsuario(${u.id})">Editar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function cargarAdminEmpresas() {
  try {
    const empresas = await adminApi('GET','/empresas');
    renderAdminEmpresasList(empresas);
  } catch(e) {
    toast('Error al cargar empresas: '+e.message,'error');
  }
}

function renderAdminEmpresasList(empresas) {
  const container = document.getElementById('adminContent');
  if (!container) return;
  
  container.innerHTML = `
    <div class="admin-header">
      <h2>Empresas</h2>
      <button class="btn btn-primary" onclick="openModal('modalAdminEmpresa')">+ Nueva Empresa</button>
    </div>
    <div class="admin-grid">
      ${empresas.map(e => `
        <div class="admin-empresa-card">
          <div class="empresa-logo">${e.logo_pdf_url ? `<img src="${esc(e.logo_pdf_url)}">` : esc(e.nombre_corto||e.nombre||'?')[0]}</div>
          <div class="empresa-info">
            <div class="empresa-nombre">${esc(e.nombre)}</div>
            <div class="empresa-corto">${esc(e.nombre_corto||'')}</div>
            <span class="badge ${e.activo?'ok':'error'}">${e.activo?'Activa':'Inactiva'}</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="editarAdminEmpresa('${e.id}')">Editar</button>
        </div>
      `).join('')}
    </div>
  `;
}

// Crear/Editar Usuario
function abrirNuevoUsuarioAdmin() {
  document.getElementById('adminUsuarioForm').reset();
  document.getElementById('editUsuarioId').value = '';
  document.getElementById('modalAdminUsuarioTitle').textContent = 'Nuevo Usuario';
  openModal('modalAdminUsuario');
}

async function guardarAdminUsuario() {
  const id = document.getElementById('editUsuarioId').value;
  const datos = {
    nombre: document.getElementById('adminUsuarioNombre').value.trim(),
    email: document.getElementById('adminUsuarioEmail').value.trim(),
    telefono: document.getElementById('adminUsuarioTel').value.trim(),
    rol: document.getElementById('adminUsuarioRol').value,
    pin: document.getElementById('adminUsuarioPin').value || undefined,
  };
  
  if (!datos.nombre) { toast('Nombre requerido','warn'); return; }
  if (!datos.pin && !id) { toast('PIN requerido para nuevo usuario','warn'); return; }
  
  try {
    if (id) {
      await adminApi('PATCH','/usuarios/'+id, datos);
      toast('Usuario actualizado','ok');
    } else {
      await adminApi('POST','/usuarios', datos);
      toast('Usuario creado','ok');
    }
    closeModal('modalAdminUsuario');
    cargarAdminUsuarios();
  } catch(e) { toast('Error: '+e.message,'error'); }
}

async function editarAdminUsuario(id) {
  try {
    const u = await adminApi('GET','/usuarios/'+id);
    document.getElementById('editUsuarioId').value = u.id;
    document.getElementById('adminUsuarioNombre').value = u.nombre || '';
    document.getElementById('adminUsuarioEmail').value = u.email || '';
    document.getElementById('adminUsuarioTel').value = u.telefono || '';
    document.getElementById('adminUsuarioRol').value = u.rol || 'usuario';
    document.getElementById('modalAdminUsuarioTitle').textContent = 'Editar Usuario';
    openModal('modalAdminUsuario');
  } catch(e) { toast('Error: '+e.message,'error'); }
}

// Crear/Editar Empresa
function abrirNuevaEmpresaAdmin() {
  document.getElementById('adminEmpresaForm').reset();
  document.getElementById('editEmpresaId').value = '';
  document.getElementById('modalAdminEmpresaTitle').textContent = 'Nueva Empresa';
  openModal('modalAdminEmpresa');
}

async function guardarAdminEmpresa() {
  const id = document.getElementById('editEmpresaId').value;
  const datos = {
    id: document.getElementById('adminEmpresaId').value.trim().toUpperCase(),
    nombre: document.getElementById('adminEmpresaNombre').value.trim(),
    nombre_corto: document.getElementById('adminEmpresaCorto').value.trim(),
    color_primario: document.getElementById('adminEmpresaColor').value,
    tema_default: document.getElementById('adminEmpresaTema').value,
  };
  
  if (!datos.id) { toast('ID de empresa requerido','warn'); return; }
  if (!datos.nombre) { toast('Nombre de empresa requerido','warn'); return; }
  
  try {
    if (id) {
      await adminApi('PATCH','/empresas/'+id, datos);
      toast('Empresa actualizada','ok');
    } else {
      await adminApi('POST','/empresas', datos);
      toast('Empresa creada','ok');
    }
    closeModal('modalAdminEmpresa');
    cargarAdminEmpresas();
  } catch(e) { toast('Error: '+e.message,'error'); }
}

async function editarAdminEmpresa(id) {
  try {
    const e = await adminApi('GET','/empresas/'+id);
    document.getElementById('editEmpresaId').value = e.id;
    document.getElementById('adminEmpresaId').value = e.id || '';
    document.getElementById('adminEmpresaNombre').value = e.nombre || '';
    document.getElementById('adminEmpresaCorto').value = e.nombre_corto || '';
    document.getElementById('adminEmpresaColor').value = e.color_primario || '#a0a0a0';
    document.getElementById('adminEmpresaTema').value = e.tema_default || 'neutro';
    document.getElementById('modalAdminEmpresaTitle').textContent = 'Editar Empresa';
    openModal('modalAdminEmpresa');
  } catch(e) { toast('Error: '+e.message,'error'); }
}

// Config de empresa (para admins de empresa)
async function cargarConfigEmpresa() {
  try {
    const config = await empresaApi('GET','/config');
    document.getElementById('configEmpresaNombre').value = config.nombre || '';
    document.getElementById('configEmpresaCorto').value = config.nombre_corto || '';
    document.getElementById('configEmpresaColor').value = config.color_primario || '#a0a0a0';
    document.getElementById('configEmpresaTema').value = config.tema_default || 'neutro';
    document.getElementById('configEmpresaTel').value = config.telefono || '';
    document.getElementById('configEmpresaEmail').value = config.email || '';
    // Logos
    document.getElementById('configLogoLogin').value = config.logo_login_url || '';
    document.getElementById('configLogoHeader').value = config.logo_header_url || '';
    document.getElementById('configLogoPdf').value = config.logo_pdf_url || '';
    document.getElementById('configLogoFavicon').value = config.logo_favicon_url || '';
  } catch(e) { toast('Error: '+e.message,'error'); }
}

async function guardarConfigEmpresa() {
  const datos = {
    nombre: document.getElementById('configEmpresaNombre').value.trim(),
    nombre_corto: document.getElementById('configEmpresaCorto').value.trim(),
    color_primario: document.getElementById('configEmpresaColor').value,
    tema_default: document.getElementById('configEmpresaTema').value,
    telefono: document.getElementById('configEmpresaTel').value.trim(),
    email: document.getElementById('configEmpresaEmail').value.trim(),
    logo_login_url: document.getElementById('configLogoLogin').value.trim(),
    logo_header_url: document.getElementById('configLogoHeader').value.trim(),
    logo_pdf_url: document.getElementById('configLogoPdf').value.trim(),
    logo_favicon_url: document.getElementById('configLogoFavicon').value.trim(),
  };
  
  try {
    await empresaApi('PATCH','/config', datos);
    toast('Configuración guardada','ok');
    // Recargar empresa en estado
    const config = await empresaApi('GET','/config');
    S.empresa = {...S.empresa, ...config};
    localStorage.setItem('pd_empresa', JSON.stringify(S.empresa));
    actualizarLogos();
  } catch(e) { toast('Error: '+e.message,'error'); }
}