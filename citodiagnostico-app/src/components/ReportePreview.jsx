import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function driveImg(url) {
  if (!url) return '';
  let id = '';
  if (url.includes('id=')) {
    const m = url.match(/id=([^&]+)/);
    id = m ? m[1] : '';
  } else {
    const m = url.match(/[-\w]{25,}/);
    id = m ? m[0] : '';
  }
  if (!id) return url;
  return 'https://lh3.googleusercontent.com/d/' + id;
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

function imprimirReporte(html) {
  const v = window.open('', '_blank', 'width=850,height=1100');
  v.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte</title>'
    + '<style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Arial,sans-serif;font-size:11px;color:#1a0d14;background:#fff;padding:8px}'
    + '@page{size:letter;margin:8mm}'
    + '</style></head><body>' + html
    + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},800)}<\/scr'+'ipt>'
    + '</body></html>');
  v.document.close();
}

export default function ReportePreview({ cito, dx, onGuardarDrive }) {
  const { config } = useApp();
  const c = config || {};
  const [logoB64,  setLogoB64]  = useState('');
  const [firmaB64, setFirmaB64] = useState('');

  const labNombre    = c['LAB_NOMBRE']    || 'Centro Citodiagnostico de la Mujer';
  const labTel       = c['LAB_TELEFONO']  || '';
  const labEmail     = c['LAB_EMAIL']     || '';
  const labDir       = c['LAB_DIRECCION'] || '';
  const labLogoUrl   = driveImg(c['LAB_LOGO_URL']   || '');
  const citoCargo    = c['CITO_CARGO']    || 'MEDICO CITOLOGO';
  const citoFirmaUrl = driveImg(c['CITO_FIRMA_URL'] || '');
  const labSlogan    = c['LAB_SLOGAN']    || 'Diagnostico confiable en tiempo record';
  const labNota      = c['REPORTE_NOTA']  || 'NOTA: LAMINAS SE CONSERVARAN UNICAMENTE POR 6 MESES DESPUES DE RECIBIDA LA MUESTRA.';

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

  function buildHTML(logo, firma) {
    const logoTag = logo
      ? '<img src="' + logo + '" style="max-height:65px;max-width:220px;object-fit:contain" alt="Logo"/>'
      : '<div style="font-size:14px;font-weight:bold;color:#802f58">' + labNombre + '</div>';

    const firmaTag = firma
      ? '<img src="' + firma + '" style="max-height:85px;max-width:220px;object-fit:contain;display:block;margin:0 auto 10px" alt="Firma y sello"/>'
      : '<div style="height:45px;border-bottom:1px solid #ccc;width:160px;margin:0 auto 10px"></div>';

    const liquidaTag = esLiquida
      ? '<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:4px 18px;font-size:10px;font-weight:bold;color:#1e40af">CITOLOGIA EN BASE LIQUIDA</div>'
      : '';

    // Diagnostico principal con resaltado amarillo tipo marcador
    const dx1Resaltado = dx1
      ? '<div style="background:#fff9c4;border-left:3px solid #f59e0b;padding:6px 10px;border-radius:3px;font-weight:bold;font-size:12px;margin-bottom:4px">' + dx1 + '</div>'
      : '';

    return '<div style="max-width:680px;margin:0 auto;font-family:Arial,sans-serif;font-size:11px;color:#1a0d14;background:#fff">'

      // ENCABEZADO — logo izquierda, contacto derecha, sin fondo de color
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:2px solid #802f58">'
      + '<div>' + logoTag + '</div>'
      + '<div style="text-align:right;font-size:10px;color:#444;line-height:1.9">'
      + (labTel   ? '<div>' + labTel   + '</div>' : '')
      + (labEmail ? '<div>' + labEmail + '</div>' : '')
      + (labDir   ? '<div>' + labDir   + '</div>' : '')
      + '</div></div>'

      // Titulo
      + '<div style="background:#802f58;color:white;text-align:center;padding:6px;font-size:12px;font-weight:bold;letter-spacing:0.1em">REPORTE DE ESTUDIO CITOLOGICO</div>'
      + liquidaTag

      // Datos paciente
      + '<div style="padding:10px 18px 8px">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;border-bottom:1px solid #e8d0dc;padding-bottom:10px;margin-bottom:8px">'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Nombre de la paciente</div><div style="font-weight:bold;font-size:12px">' + (cito?.nombre||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Medico refiere</div><div style="font-weight:bold">' + (cito?.medico||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080"># Citologia</div><div style="font-weight:bold;font-size:14px;color:#802f58">' + (cito?.idCito||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Edad</div><div style="font-weight:bold">' + (cito?.edad ? cito.edad+' ANOS' : '') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Tipo de muestra</div><div style="font-weight:bold">' + (dx?.tipoMuestra||'EXTENDIDO CONVENCIONAL') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Muestra recibida</div><div style="font-weight:bold;color:' + (esLiquida?'#1e40af':'inherit') + '">' + (cito?.muestra||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Fecha de recepcion</div><div>' + (cito?.fecha||'') + '</div></div>'
      + '<div><div style="font-size:9px;text-transform:uppercase;color:#9a7080">Fecha de reporte</div><div>' + fechaReporte + '</div></div>'
      + '</div>'

      // Calidad
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">' + (dx?.calidad||'') + '</div>'

      // Interpretacion
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 6px;border-radius:3px">Interpretacion de resultados</div>'
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">' + dx1 + '</div>'

      // Hallazgos
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 6px;border-radius:3px">Hallazgos no neoplasicos</div>'
      + '<div style="display:grid;grid-template-columns:160px 1fr;gap:3px;font-size:11px;margin-bottom:8px">'
      + '<span style="color:#9a7080">Variaciones celulares:</span><span>' + (dx?.variaciones||'') + '</span>'
      + '<span style="color:#9a7080">Cambios reactivos:</span><span>' + (dx?.cambiosReactivos||'') + '</span>'
      + '<span style="color:#9a7080">Flora bacteriana:</span><span>' + (dx?.flora||'') + '</span>'
      + '<span style="color:#9a7080">Microorganismos:</span><span>' + (dx?.microorganismos||'') + '</span>'
      + '</div>'
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">' + (dx?.observaciones||'SIN OBSERVACIONES') + '</div>'

      // DIAGNOSTICO — con resaltado amarillo en DX1
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 8px;border-radius:3px">Diagnostico</div>'
      + '<div style="font-size:11px;line-height:1.8;margin-bottom:8px">'
      + dx1Resaltado
      + (dx2 ? '<div style="padding:2px 0">' + dx2 + '</div>' : '')
      + (dx3 ? '<div style="padding:2px 0">' + dx3 + '</div>' : '')
      + (dx4 ? '<div style="padding:2px 0">' + dx4 + '</div>' : '')
      + '</div>'

      // Comentarios
      + '<div style="background:#fbeaf0;color:#802f58;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.07em;padding:5px 10px;margin:10px 0 6px;border-radius:3px">Comentarios y sugerencias</div>'
      + '<div style="font-size:11px;line-height:1.6;margin-bottom:6px">'
      + (dx?.comentarios||'SIN COMENTARIOS RELACIONADOS')
      + (dx?.comentariosLibres ? '<div style="margin-top:4px">' + dx.comentariosLibres + '</div>' : '')
      + '</div></div>'

      // FIRMA — solo imagen + cargo
      + '<div style="text-align:center;margin:10px 0;border-top:1px solid #e8d0dc;padding:16px 0">'
      + '<div style="display:inline-block;border:1px solid #e8d0dc;padding:12px 28px;border-radius:6px;min-width:180px">'
      + firmaTag
      + '<div style="font-size:10px;font-weight:bold;color:#333;letter-spacing:0.03em">' + citoCargo + '</div>'
      + '</div></div>'

      // Pie
      + '<div style="text-align:center;font-style:italic;color:#802f58;font-size:11px;border-top:1px solid #e8d0dc;padding:10px 18px;line-height:1.8">'
      + '"' + labSlogan + '"<br>'
      + '<span style="font-style:normal;font-size:9px;color:#9a7080">' + labNota + '</span>'
      + '<div style="font-size:9px;color:#aaa;margin-top:6px">Fecha de reporte: ' + fechaReporte + '</div>'
      + '</div>'
      + '</div>';
  }

  return (
    <div>
      <div className="btn-group no-print" style={{ justifyContent:'center', marginBottom:18 }}>
        <button className="btn" onClick={()=>imprimirReporte(buildHTML(logoB64||labLogoUrl, firmaB64||citoFirmaUrl))}>
          Imprimir
        </button>
        <button className="btn btn-primary" onClick={onGuardarDrive}>
          Guardar en Drive + REALIZADO
        </button>
      </div>
      <div id="reporte-imprimible"
        style={{ maxWidth:680, margin:'0 auto', background:'#fff', border:'1px solid #ccc', borderRadius:6, overflow:'hidden' }}
        dangerouslySetInnerHTML={{ __html: buildHTML(logoB64||labLogoUrl, firmaB64||citoFirmaUrl) }}
      />
    </div>
  );
}
