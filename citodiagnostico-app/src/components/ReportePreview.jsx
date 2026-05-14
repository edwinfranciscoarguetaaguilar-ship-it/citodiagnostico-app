import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function driveImg(url) {
  if (!url) return '';
  let id = '';
  if (url.includes('uc?') || url.includes('thumbnail?')) {
    const m = url.match(/id=([^&]+)/);
    id = m ? m[1] : '';
  } else {
    const m = url.match(/[-\w]{25,}/);
    id = m ? m[0] : '';
  }
  if (!id) return url;
  return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w400';
}

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

function imprimirReporte(htmlContent) {
  const v = window.open('', '_blank', 'width=850,height=1100');
  v.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte</title>'
    + '<style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Arial,sans-serif;font-size:11px;color:#1a0d14;background:#fff;padding:10px}'
    + '@page{size:letter;margin:8mm}'
    + '</style></head><body>'
    + htmlContent
    + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},800)}<\/scr' + 'ipt>'
    + '</body></html>');
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

  useEffect(() => {
    if (labLogoUrl)   toBase64(labLogoUrl).then(b => { if(b) setLogoB64(b); });
    if (citoFirmaUrl) toBase64(citoFirmaUrl).then(b => { if(b) setFirmaB64(b); });
  }, [labLogoUrl, citoFirmaUrl]);

  const ahora = new Date();
  const fechaReporte = ahora.toLocaleDateString('es-SV', { day:'2-digit', month:'2-digit', year:'numeric' })
    + ' ' + ahora.toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit' });

  const dx1 = dx?.dx1 || dx?.interpretacion || '';
  const dx2 = dx?.dx2 || '';
  const dx3 = dx?.dx3 || '';
  const dx4 = dx?.dx4 || '';
  const esLiquida = cito?.muestra === 'CITOLOGIA LIQUIDA';

  const contacto = [labTel, labEmail, labDir].filter(Boolean).join(' · ');

  function buildHTML(logo, firma) {
    const logoTag  = logo  ? '<img src="' + logo  + '" style="height:55px;max-width:200px;object-fit:contain" alt="Logo"/>' : '<div style="font-size:14px;font-weight:bold">' + labNombre + '</div>';
    const firmaTag = firma ? '<img src="' + firma + '" style="height:55px;max-width:200px;object-fit:contain;display:block;margin:0 auto 6px" alt="Firma"/>' : '<div style="height:40px;border-bottom:1px solid #ccc;width:160px;margin:0 auto 8px"></div>';
    const liquidaTag = esLiquida ? '<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:4px 18px;font-size:10px;font-weight:bold;color:#1e40af">&#128167; CITOLOGÍA EN BASE LÍQUIDA</div>' : '';

    return '<div style="max-width:680px;margin:0 auto;font-family:Arial,sans-serif;font-size:11px;color:#1a0d14;background:#fff">'

      // Header
      + '<div style="background:#802f58;color:white;padding:14px 18px;display:flex;align-items:center;gap:14px">'
      + logoTag
      + '<div><div style="font-size:10px;opacity:0.85;margin-top:3px">' + contacto + '</div></div>'
      + '</div>'

      // Título
      + '<div style="background:#802f58;color:white;text-align:center;padding:6px;font-size:12px;font-weight:bold;letter-spacing:0.1em">REPORTE DE ESTUDIO CITOLÓGICO</div>'

      + liquidaTag

      // Datos
      + '<div style="padding:10px 18px 8px">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;border-bottom:1px solid #e8d0dc;padding-bottom:10px;margin-bottom:8px">'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Nombre de la paciente</div><div style="font-weight:bold;font-size:12px">' + (cito?.nombre||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Médico refiere</div><div style="font-weight:bold">' + (cito?.medico||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080"># Citología</div><div style="font-weight:bold;font-size:14px;color:#802f58">' + (cito?.idCito||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Edad</div><div style="font-weight:bold">' + (cito?.edad ? cito.edad+' AÑOS' : '') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Tipo de muestra</div><div style="font-weight:bold">' + (dx?.tipoMuestra||'EXTENDIDO CONVENCIONAL') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Muestra recibida</div><div style="font-weight:bold;color:' + (esLiquida?'#1e40af':'inherit') + '">' + (cito?.muestra||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Fecha de recepción</div><div>' + (cito?.fecha||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Fecha de reporte</div><div>' + fechaReporte + '</div></div>'
      + '</div>'

      // Calidad
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">' + (dx?.calidad||'') + '</div>'

      // Interpretación
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 6px;border-radius:3px">Interpretación de resultados</div>'
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">' + dx1 + '</div>'

      // Hallazgos
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 6px;border-radius:3px">Hallazgos no neoplásicos</div>'
      + '<div style="display:grid;grid-template-columns:160px 1fr;gap:3px;font-size:11px;margin-bottom:8px">'
      + '<span style="color:#9a7080">Variaciones celulares:</span><span>' + (dx?.variaciones||'') + '</span>'
      + '<span style="color:#9a7080">Cambios reactivos:</span><span>' + (dx?.cambiosReactivos||'') + '</span>'
      + '<span style="color:#9a7080">Flora bacteriana:</span><span>' + (dx?.flora||'') + '</span>'
      + '<span style="color:#9a7080">Microorganismos:</span><span>' + (dx?.microorganismos||'') + '</span>'
      + '</div>'
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">' + (dx?.observaciones||'SIN OBSERVACIONES') + '</div>'

      // Diagnóstico
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 6px;border-radius:3px">Diagnóstico</div>'
      + '<div style="font-size:11px;line-height:1.8;margin-bottom:6px">'
      + (dx1 ? '<div>' + dx1 + '</div>' : '')
      + (dx2 ? '<div>' + dx2 + '</div>' : '')
      + (dx3 ? '<div>' + dx3 + '</div>' : '')
      + (dx4 ? '<div>' + dx4 + '</div>' : '')
      + '</div>'

      // Comentarios
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 6px;border-radius:3px">Comentarios y sugerencias</div>'
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">' + (dx?.comentarios||'SIN COMENTARIOS RELACIONADOS')
      + (dx?.comentariosLibres ? '<div style="margin-top:4px">' + dx.comentariosLibres + '</div>' : '')
      + '</div>'
      + '</div>'

      // Firma
      + '<div style="text-align:center;margin:10px 0;border-top:1px solid #e8d0dc;padding:16px 0">'
      + '<div style="display:inline-block;border:1px solid #e8d0dc;padding:10px 24px;border-radius:6px">'
      + firmaTag
      + '<div style="font-weight:bold;font-size:11px">' + citoNombre + '</div>'
      + '<div style="font-size:9px;color:#9a7080">' + citoTitulo + ' · ' + citoColegiado + '</div>'
      + '<div style="font-size:9px;color:#9a7080;font-weight:bold">' + citoCargo + '</div>'
      + '</div></div>'

      // Pie
      + '<div style="text-align:center;font-style:italic;color:#802f58;font-size:11px;border-top:1px solid #e8d0dc;padding:10px 18px;line-height:1.8">'
      + '"' + labSlogan + '"<br>'
      + '<span style="font-style:normal;font-size:9px;color:#9a7080">' + labNota + '</span>'
      + '<div style="font-size:9px;color:#aaa;margin-top:6px">Fecha de reporte: ' + fechaReporte + '</div>'
      + '</div>'

      + '</div>';
  }

  const handleImprimir = () => {
    imprimirReporte(buildHTML(logoB64 || labLogoUrl, firmaB64 || citoFirmaUrl));
  };

  return (
    <div>
      <div className="btn-group no-print" style={{ justifyContent:'center', marginBottom:18 }}>
        <button className="btn" onClick={handleImprimir}>🖨️ Imprimir</button>
        <button className="btn btn-primary" onClick={onGuardarDrive}>☁️ Guardar en Drive + REALIZADO</button>
      </div>
      <div id="reporte-imprimible"
        style={{ maxWidth:680, margin:'0 auto', background:'#fff', border:'1px solid #ccc', borderRadius:6, overflow:'hidden' }}
        dangerouslySetInnerHTML={{ __html: buildHTML(logoB64 || labLogoUrl, firmaB64 || citoFirmaUrl) }}
      />
    </div>
  );
}
