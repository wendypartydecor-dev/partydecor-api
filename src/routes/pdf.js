const router   = require('express').Router();
const puppeteer = require('puppeteer');
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');

// Helpers
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(n) {
  return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildHtml(d) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{margin:12mm 10mm;size:A4;}
html,body{font-family:Arial,Helvetica,sans-serif;background:#f7d9d9;}
.hdr{background:#fff;padding:18px 28px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #f7d9d9;}
.hdr-logo{width:60px;height:60px;display:flex;align-items:center;justify-content:center;}
.hdr-center{text-align:center;flex:1;}
.hdr-title{font-size:9px;font-weight:700;letter-spacing:5px;color:#555;text-transform:uppercase;margin-bottom:4px;}
.hdr-main{font-size:24px;font-weight:900;letter-spacing:6px;color:#1a1a1a;text-transform:uppercase;line-height:1;}
.hdr-folio{font-size:11px;letter-spacing:3px;color:#555;margin-top:5px;font-weight:600;}
.hdr-fecha{font-size:10px;color:#777;margin-top:3px;}
.hdr-spacer{width:60px;}
.body{padding:16px 28px;}
.sec-hdr{letter-spacing:5px;font-size:9px;font-weight:700;text-transform:uppercase;color:#b07070;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e8c8c8;}
.cli-grid{display:grid;grid-template-columns:90px 1fr;margin-bottom:18px;background:#fff;border:1px solid #e0c0c0;border-radius:8px;overflow:hidden;}
.cli-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#888;padding:5px 8px;border-bottom:1px solid #f5e8e8;}
.cli-val{font-size:11px;color:#1a1a1a;padding:5px 8px;border-bottom:1px solid #f5e8e8;}
table.prod{width:100%;border-collapse:collapse;font-size:11px;background:#fff;border-radius:8px;overflow:hidden;}
table.prod thead{display:table-header-group;background:#f7d9d9;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
table.prod thead th{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#666;padding:7px 8px;text-align:left;border:1px solid #e0c8c8;background:#f7d9d9;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
table.prod thead th.r{text-align:right;}
table.prod tbody tr{page-break-inside:avoid;border:1px solid #f0e8e8;}
table.prod tbody td{padding:7px 8px;vertical-align:middle;color:#1a1a1a;border:1px solid #f0e8e8;}
table.prod tbody td.r{text-align:right;}
.p-name{font-weight:600;font-size:11px;}
.p-desc{font-size:9px;color:#888;margin-top:1px;font-style:italic;}
.bloque-final{page-break-inside:avoid;}
.tots-wrap{display:flex;justify-content:flex-end;margin-bottom:14px;}
.tots-inner{width:210px;background:#fff;border:1px solid #e0c0c0;border-radius:8px;overflow:hidden;}
.tot-row{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid #f5eaea;font-size:11px;}
.tot-row:last-child{border-bottom:none;}
.tot-lbl{color:#666;font-size:10px;}
.tot-val{font-weight:700;color:#1a1a1a;}
.tot-grand{background:#f7d9d9;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.tot-grand .tot-lbl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#444;}
.tot-grand .tot-val{font-size:14px;font-weight:900;color:#1a1a1a;}
.nota{font-size:9px;color:#777;line-height:1.6;padding:7px 10px;border:1px solid #e0c0c0;background:#fff;margin-bottom:14px;border-radius:8px;}
.nota b{color:#555;}
.ftr{background:#fff;padding:10px 28px;display:flex;align-items:center;justify-content:space-between;border-top:3px solid #f7d9d9;border-radius:0 0 8px 8px;}
.ftr-logo{width:36px;height:36px;display:flex;align-items:center;justify-content:center;opacity:.6;}
.ftr-info{text-align:center;font-size:10px;color:#666;line-height:1.7;}
.ftr-info b{color:#444;font-weight:700;}
.ftr-brand{text-align:right;font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#b09090;line-height:2;}
</style></head><body>
  <div class="hdr">
    <div class="hdr-logo">${d.logoHtml}</div>
    <div class="hdr-center">
      <div class="hdr-title">${esc(d.nombreEmpresa)}</div>
      <div class="hdr-main">Cotización</div>
      <div class="hdr-folio">${esc(d.folio)}</div>
      <div class="hdr-fecha">Fecha: ${esc(d.fechaCot)}</div>
    </div>
    <div class="hdr-spacer"></div>
  </div>
  <div class="body">
    <div class="sec-hdr">C l i e n t e</div>
    <div class="cli-grid">
      <span class="cli-lbl">Nombre</span><span class="cli-val">${esc(d.cliente)}</span>
      <span class="cli-lbl">Documento</span><span class="cli-val">${esc(d.folio)}</span>
      ${d.dirRow}
      <span class="cli-lbl">Teléfono</span><span class="cli-val">${esc(d.telefono)}</span>
    </div>
    <div class="sec-hdr">P r o d u c t o s</div>
    ${d.tablaHtml}
    <div class="bloque-final">
      <div class="tots-wrap">
        <div class="tots-inner">
          <div class="tot-row"><span class="tot-lbl">Subtotal</span><span class="tot-val">${d.subtotal}</span></div>
          ${d.ivaRow}
          ${d.isrRow}
          <div class="tot-row tot-grand"><span class="tot-lbl">Total</span><span class="tot-val">${d.total}</span></div>
          ${d.anticipoRow}
        </div>
      </div>
      <div class="nota"><b>Nota:</b> Esta cotización tiene una validez de <b>30 días</b>. Después de este tiempo deberá solicitar una nueva cotización y estará sujeta a variación de precios.</div>
      <div class="ftr">
        <div class="ftr-logo">${d.logoHtml}</div>
        <div class="ftr-info"><b>${esc(d.nombreEmpresa)}</b><br>Tel. ${esc(d.telefonoEmpresa)}<br>${d.fechaEvLine}${d.tipoEvLine}</div>
        <div class="ftr-brand">${esc(d.nombreEmpresa.split(' ')[0])}</div>
      </div>
    </div>
  </div>
</body></html>`;
}

// POST /api/pdf/:idEvento
router.post('/:idEvento', requireAuth, async (req, res) => {
  const { idEvento } = req.params;
  const { iva: ivaOverride, isr: isrOverride } = req.body || {};

  try {
    // 1. Obtener datos del evento
    const { data: ev, error: evErr } = await supabase
      .from('v_eventos_completo')
      .select('*')
      .eq('id', idEvento)
      .single();
    if (evErr || !ev) return res.status(404).json({ error: 'Evento no encontrado' });

    // 2. Obtener items
    const { data: items, error: itErr } = await supabase
      .from('detalle_cotizacion')
      .select('*')
      .eq('id_ev', idEvento)
      .order('id');
    if (itErr) throw itErr;
    if (!items || items.length === 0) return res.status(400).json({ error: 'La cotización está vacía' });

    // 3. Obtener logo y nombre de la empresa
    let logoHtml = '<span style="font-size:9px;color:#c8a0a0;">LOGO</span>';
    let nombreEmpresa = 'Party Decor';
    let telefonoEmpresa = '—';
    if (ev.id_empresa) {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('logo_pdf_url, nombre, telefono')
        .eq('id', ev.id_empresa)
        .single();
      if (empresa?.logo_pdf_url) {
        logoHtml = `<img src="${empresa.logo_pdf_url}" alt="Logo" style="width:100%;height:100%;object-fit:contain;">`;
      }
      if (empresa?.nombre) nombreEmpresa = empresa.nombre;
      if (empresa?.telefono) telefonoEmpresa = empresa.telefono;
    }

    // 4. Calcular totales
    let subtotal = 0;
    items.forEach(it => subtotal += Number(it.total) || 0);

    const ivaStr = ivaOverride || ev.iva || 'No aplica';
    const isrStr = isrOverride || ev.isr || 'No aplica';
    const ivaPct  = ivaStr === '16%' ? 0.16 : ivaStr === '8%' ? 0.08 : 0;
    const isrPct  = isrStr === 'ISR 1.25%' ? 0.0125 : 0;
    const ivaAmt  = subtotal * ivaPct;
    const isrAmt  = subtotal * isrPct;
    const total   = subtotal + ivaAmt - isrAmt;
    const anticipo = Number(ev.anticipo) || 0;

    // 5. Formatear fecha
    const hoy = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
    const fechaEv = ev.f_ev ? new Date(ev.f_ev + 'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' }) : '';
    const telefonos = [ev.tel1, ev.tel2].filter(Boolean).join(' · ') || '—';
    const dirEv = ev.dir || ev.dir_cli || '';

    // 6. Construir filas de la tabla
    const filasItems = items.map((it, i) => {
      const bgRow = i % 2 === 1 ? ' style="background:#fdf7f7"' : '';
      const descLine = it.descripcion ? `<div class="p-desc">${esc(it.descripcion)}</div>` : '';
      return `<tr${bgRow}>
        <td><div class="p-name">${esc(it.nombre)}</div>${descLine}</td>
        <td class="r">${Number(it.cantidad)}</td>
        <td class="r">$${fmt(it.precio)}</td>
        <td class="r">$${fmt(Number(it.total) || 0)}</td>
      </tr>`;
    }).join('');

    const tablaHtml = `<table class="prod">
      <thead><tr>
        <th>Producto</th><th class="r">Cantidad</th><th class="r">Precio unit.</th><th class="r">Total</th>
      </tr></thead>
      <tbody>${filasItems}</tbody>
    </table>`;

    const ivaRow     = ivaPct > 0 ? `<div class="tot-row"><span class="tot-lbl">IVA (${ivaStr})</span><span class="tot-val">$${fmt(ivaAmt)}</span></div>` : '';
    const isrRow     = isrPct > 0 ? `<div class="tot-row"><span class="tot-lbl">ISR (1.25%)</span><span class="tot-val">$${fmt(isrAmt)}</span></div>` : '';
    const anticipoRow = anticipo > 0
      ? `<div class="tot-row"><span class="tot-lbl">Anticipo recibido</span><span class="tot-val" style="color:#4a9060">-$${fmt(anticipo)}</span></div>
         <div class="tot-row"><span class="tot-lbl">Saldo pendiente</span><span class="tot-val" style="color:#c05050">$${fmt(Math.max(0, total - anticipo))}</span></div>`
      : '';
    const dirRow = dirEv ? `<span class="cli-lbl">Dirección</span><span class="cli-val">${esc(dirEv)}</span>` : '';

    // 7. Generar PDF con Puppeteer
    const html = buildHtml({
      logoHtml,
      nombreEmpresa,
      telefonoEmpresa,
      folio:      idEvento,
      cliente:    ev.cli || '',
      telefono:   telefonos,
      fechaCot:   hoy,
      dirRow,
      tablaHtml,
      subtotal:   '$' + fmt(subtotal),
      ivaRow,
      isrRow,
      anticipoRow,
      total:      '$' + fmt(total),
      fechaEvLine: fechaEv ? `Fecha del evento: ${fechaEv}<br>` : '',
      tipoEvLine:  ev.tipo ? esc(ev.tipo) : ''
    });

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
      printBackground: true
    });
    await browser.close();

    const nombreArchivo = `Cotizacion_${idEvento}_${(ev.cli||'').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/g,'_').substring(0,30)}.pdf`;

    // Guardar en Supabase Storage
    const { data: upload, error: upErr } = await supabase.storage
      .from('pdfs')
      .upload(nombreArchivo, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(nombreArchivo);

    // Actualizar URL en el evento
    await supabase.from('eventos').update({ pdf_url: publicUrl }).eq('id', idEvento);

    res.json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error('PDF:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;