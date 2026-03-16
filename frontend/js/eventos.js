// js/eventos.js — Gestión de eventos
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

// Modal Evento
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

// Buscar cliente en modal evento
function buscarClienteParaEvento() {
  const q  = document.getElementById('evClienteSearch').value.trim().toLowerCase();
  const dd = document.getElementById('evClienteDd');
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

// Guardar evento
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