import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// Convierte URL Drive a URL directa
function driveImg(url) {
  if (!url) return '';
  if (url.includes('uc?')) return url;
  const match = url.match(/[-\w]{25,}/);
  return match ? `https://drive.google.com/uc?export=view&id=${match[0]}` : url;
}

// Convierte imagen a base64 para que funcione al imprimir
async function toBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
}

// Abre ventana de impresión con solo el reporte
function imprimirReporte(htmlContent) {
  const v = window.open('', '_blank', 'width=850,height=1100');
  v.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte Citológico</title>
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
    @page { size: letter; margin: 10mm; }
    @media print { html, body { width: 100%; height: 100%; } }
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 800); };
  <\/script>
</body>
</html>`);
  v.document.close();
}

export default function ReportePreview({ cito, dx, onGuardarDrive }) {
  const { config } = useApp();
  const c = config || {};

  const [logoB64,  setLogoB64]  = useState('');
  const [firmaB64, setFirmaB64] = useState('');

  const labNombre    = c['LAB_NOMBRE']    || 'Centro Citodiagnóstico de la Mujer';
  const labTel       = c['LAB_TELEFONO']  || '';
  const labEmail     = c['LAB_EMAIL']     || '';
  const labDir       = c['LAB_DIRECCION'] || '';
  const labLogoUrl   = driveImg(c['LAB_LOGO_URL']   || '');
  const citoNombre   = c['CITO_NOMBRE']   || '';
  const citoTitulo   = c['CITO_TITULO']   || '';
  const citoColegiado= c['CITO_COLEGIADO']|| '';
  const citoCargo    = c['CITO_CARGO']    || '';
  const citoFirmaUrl = driveImg(c['CITO_FIRMA_URL'] || '');
  const labSlogan    = c['LAB_SLOGAN']    || 'Diagnóstico confiable en tiempo récord';
  const labNota      = c['REPORTE_NOTA']  || 'NOTA: LÁMINAS SE CONSERVARÁN ÚNICAMENTE POR 6 MESES DESPUÉS DE RECIBIDA LA MUESTRA.';

  // Precargar imágenes como base64
  useEffect(() => {
    if (labLogoUrl)   toBase64(labLogoUrl).then(setLogoB64);
    if (citoFirmaUrl) toBase64(citoFirmaUrl).then(setFirmaB64);
  }, [labLogoUrl, citoFirmaUrl]);

  const ahora = new Date();
  const fechaReporte = ahora.toLocaleDateString('es-SV', {
    day:'2-digit', month:'2-digit', year:'numeric'
  }) + ' ' + ahora.toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit' });

  const dx1 = dx?.dx1 || dx?.interpretacion || '';
  const dx2 = dx?.dx2 || '';
  const dx3 = dx?.dx3 || '';
  const dx4 = dx?.dx4 || '';
  const esLiquida = cito?.muestra === 'CITOLOGIA LIQUIDA';

  // HTML del reporte — se usa tanto para preview como para print
  const getReporteHTML = (logo64, firma64) => `
<div style="max-width:680px;margin:0 auto;font-family:Arial,sans-serif;font-size:11px;color:#111;background:#fff">

  <!-- ENCABEZADO -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:2px solid #802f58">
    <div>
      ${logo64
        ? `<img src="${logo64}" style="max-height:65px;max-width:220px;object-fit:contain" alt="Logo"/>`
        : `<div style="font-weight:bold;font-size:14px;color:#802f58">${labNombre}</div>`
      }
    </div>
    <div style="text-align:right;font-size:10px;color:#444;line-height:1.9">
      ${labTel   ? `<div>📞 ${labTel}</div>` : ''}
      ${labEmail ? `<div>✉️ ${labEmail}</div>` : ''}
      ${labDir   ? `<div>📍 ${labDir}</div>` : ''}
    </div>
  </div>

  <!-- TÍTULO -->
  <div style="background:#802f58;color:#fff;text-align:center;padding:7px;font-size:12px;font-weight:bold;letter-spacing:0.08em">
    REPORTE DE ESTUDIO CITOLÓGICO
  </div>

  <!-- INDICADOR LÍQUIDA -->
  ${esLiquida ? `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:4px 18px;font-size:10px;font-weight:bold;color:#1e40af">💧 CITOLOGÍA EN BASE LÍQUIDA</div>` : ''}

  <!-- DATOS DEL PACIENTE -->
  <div style="padding:10px 18px;border-bottom:1px solid #ddd">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:3px 6px;width:33%">
          <div style="font-size:9px;text-transform:uppercase;color:#888">Nombre de la Paciente:</div>
          <div style="font-weight:bold;font-size:12px">${cito?.nombre || ''}</div>
        </td>
        <td style="padding:3px 6px;width:33%">
          <div style="font-size:9px;text-transform:uppercase;color:#888">Refiere:</div>
          <div style="font-weight:bold">${cito?.medico || ''}</div>
        </td>
        <td style="padding:3px 6px;width:33%;text-align:right">
          <div style="font-size:9px;text-transform:uppercase;color:#888">N° Citología:</div>
          <div style="font-weight:bold;font-size:16px;color:#802f58">${cito?.idCito || ''}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:3px 6px">
          <div style="font-size:9px;text-transform:uppercase;color:#888">Edad:</div>
          <div>${cito?.edad ? cito.edad + ' AÑOS' : ''}</div>
        </td>
        <td style="padding:3px 6px">
          <div style="font-size:9px;text-transform:uppercase;color:#802f58;font-weight:bold">TIPO DE MUESTRA:</div>
          <div style="font-weight:bold;color:#802f58">${dx?.tipoMuestra || 'EXTENDIDO CONVENCIONAL'}</div>
        </td>
        <td style="padding:3px 6px">
          <div style="font-size:9px;text-transform:uppercase;color:#802f58;font-weight:bold">MUESTRA RECIBIDA</div>
          <div style="font-weight:bold;color:${esLiquida?'#1e40af':'#802f58'}">${cito?.muestra || ''}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:3px 6px">
          <div style="font-size:9px;text-transform:uppercase;color:#888">Fecha de Recepción:</div>
          <div>${cito?.fecha || ''}</div>
        </td>
        <td style="padding:3px 6px" colspan="2">
          <div style="font-size:9px;text-transform:uppercase;color:#888">Fecha de Reporte:</div>
          <div>${fechaReporte}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- CALIDAD -->
  <div style="padding:6px 18px;font-size:11px;background:#fdf9fb;border-bottom:1px solid #eee">
    ${dx?.calidad || ''}
  </div>

  <!-- INTERPRETACIÓN -->
  <div style="padding:4px 18px 0">
    <div style="background:#802f58;color:#fff;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;padding:3px 10px;border-radius:3px;display:inline-block;margin:8px 0 5px">
      INTERPRETACIÓN DE RESULTADOS:
    </div>
    <div style="font-size:11px;line-height:1.6;padding-left:4px;padding-bottom:6px">${dx1}</div>
  </div>

  <!-- HALLAZGOS -->
  <div style="padding:0 18px">
    <div style="background:#802f58;color:#fff;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;padding:3px 10px;border-radius:3px;display:inline-block;margin:8px 0 6px">
      HALLAZGOS NO NEOPLÁSICOS:
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px">
      <tr>
        <td style="color:#666;padding:2px 0;width:200px">VARIACIONES CELULARES NO NEOPLÁSICOS:</td>
        <td style="padding:2px 8px">${dx?.variaciones || ''}</td>
      </tr>
      <tr>
        <td style="color:#666;padding:2px 0"></td>
        <td style="padding:2px 8px">${dx?.cambiosReactivos || ''}</td>
      </tr>
      <tr>
        <td style="color:#666;padding:2px 0">FLORA BACTERIANA:</td>
        <td style="padding:2px 8px">${dx?.flora || ''}</td>
      </tr>
      <tr>
        <td style="color:#666;padding:2px 0">MICROORGANISMOS:</td>
        <td style="padding:2px 8px">${dx?.microorganismos || ''}</td>
      </tr>
    </table>
    <div style="font-size:11px;padding-bottom:6px">${dx?.observaciones || 'SIN OBSERVACIONES'}</div>
  </div>

  <!-- DIAGNÓSTICO -->
  <div style="padding:0 18px">
    <div style="background:#802f58;color:#fff;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;padding:3px 10px;border-radius:3px;display:inline-block;margin:8px 0 6px">
      DIAGNÓSTICO:
    </div>
    <div style="font-size:11px;line-height:1.8;padding-bottom:8px">
      ${dx1 ? `<div>${dx1}</div>` : ''}
      ${dx2 ? `<div>${dx2}</div>` : ''}
      ${dx3 ? `<div>${dx3}</div>` : ''}
      ${dx4 ? `<div>${dx4}</div>` : ''}
    </div>
  </div>

  <!-- COMENTARIOS -->
  <div style="padding:0 18px 10px">
    <div style="background:#802f58;color:#fff;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;padding:3px 10px;border-radius:3px;display:inline-block;margin:8px 0 6px">
      COMENTARIOS Y SUGERENCIAS
    </div>
    <div style="font-size:11px;line-height:1.6;min-height:28px">
      ${dx?.comentarios || 'SIN COMENTARIOS RELACIONADOS'}
      ${dx?.comentariosLibres ? `<div style="margin-top:4px">${dx.comentariosLibres}</div>` : ''}
    </div>
  </div>

  <!-- FIRMA -->
  <div style="display:flex;justify-content:center;padding:16px 18px;border-top:1px solid #eee">
    <div style="text-align:center;border:1px solid #ddd;padding:10px 28px;border-radius:6px;min-width:200px">
      ${firma64
        ? `<img src="${firma64}" style="max-height:90px;max-width:220px;object-fit:contain;display:block;margin:0 auto 8px" alt="Firma"/>`
        : `<div style="height:50px;border-bottom:1px solid #ccc;width:180px;margin:0 auto 8px"></div>`
      }
      <div style="font-weight:bold;font-size:11px">${citoNombre}</div>
      <div style="font-size:9px;color:#666">${citoTitulo}</div>
      <div style="font-size:9px;color:#666">${citoColegiado}</div>
      <div style="font-size:9px;color:#666;font-weight:bold">${citoCargo}</div>
    </div>
  </div>

  <!-- PIE -->
  <div style="text-align:center;padding:8px 18px 12px;border-top:1px solid #eee">
    <div style="font-style:italic;color:#802f58;font-size:12px;font-weight:bold">"${labSlogan}"</div>
    <div style="font-size:9px;color:#888;margin-top:4px">${labNota}</div>
    <div style="font-size:9px;color:#aaa;margin-top:6px">Fecha de reporte: ${fechaReporte}</div>
  </div>

</div>`;

  const handleImprimir = () => {
    const html = getReporteHTML(logoB64, firmaB64);
    imprimirReporte(html);
  };

  return (
    <div>
      {/* Botones */}
      <div className="btn-group no-print" style={{ justifyContent:'center', marginBottom:18 }}>
        <button className="btn" onClick={handleImprimir}>🖨️ Imprimir</button>
        <button className="btn btn-primary" onClick={onGuardarDrive}>☁️ Guardar en Drive + REALIZADO</button>
      </div>

      {/* Preview en pantalla */}
      <div id="reporte-imprimible" style={{
        maxWidth:680, margin:'0 auto', background:'#fff',
        border:'1px solid #ccc', borderRadius:6, overflow:'hidden'
      }}
        dangerouslySetInnerHTML={{ __html: getReporteHTML(
          logoB64  || labLogoUrl,
          firmaB64 || citoFirmaUrl
        )}}
      />
    </div>
  );
}
