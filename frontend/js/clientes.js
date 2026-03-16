// js/clientes.js — Gestión de clientes
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

function abrirNuevoClienteDesdeEvento() {
  S._desdeEvento = true;
  const q = document.getElementById('evClienteSearch')?.value.trim()||'';
  ddClear('evClienteDd');
  abrirNuevoCliente();
  if (q) document.getElementById('editClienteNombre').value = q;
}