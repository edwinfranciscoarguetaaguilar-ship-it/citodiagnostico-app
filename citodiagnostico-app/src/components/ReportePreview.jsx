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

// Fecha en zona horaria El Salvador UTC-6
function fechaSV() {
  const ahora = new Date();
  const sv = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/El_Salvador' }));
  const fecha = sv.toLocaleDateString('es-SV', { day:'2-digit', month:'2-digit', year:'numeric' });
  const hora  = sv.toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit' });
  return fecha + ' ' + hora;
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
    if (labLogoUrl)   toBase64(labLogoUrl).then(b   => { if(b) setLogoB64(b); });
    if (citoFirmaUrl) toBase64(citoFirmaUrl).then(b => { if(b) setFirmaB64(b); });
  }, [labLogoUrl, citoFirmaUrl]);

  const fechaReporte = fechaSV();
  const dx1 = dx?.dx1 || dx?.interpretacion || '';
  const dx2 = dx?.dx2 || '';
  const dx3 = dx?.dx3 || '';
  const dx4 = dx?.dx4 || '';
  const esLiquida = cito?.muestra === 'CITOLOGIA LIQUIDA';
  const idCito    = cito?.idCito || '';

  function buildHTML(logo, firma) {
    const logoTag = logo
      ? '<img src="' + logo + '" style="max-height:70px;max-width:240px;object-fit:contain" alt="Logo"/>'
      : '<div style="font-size:14px;font-weight:bold;color:#802f58">' + labNombre + '</div>';

    // Sello MAS GRANDE
    const firmaTag = firma
      ? '<img src="' + firma + '" style="max-height:130px;max-width:280px;object-fit:contain;display:block;margin:0 auto 10px" alt="Sello"/>'
      : '<div style="height:80px;border-bottom:1px solid #ccc;width:200px;margin:0 auto 10px"></div>';

    const liquidaTag = esLiquida
      ? '<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:4px 18px;font-size:10px;font-weight:bold;color:#1e40af">CITOLOGIA EN BASE LIQUIDA</div>'
      : '';

    // Diagnostico 1 resaltado en amarillo
    const dx1Tag = dx1
      ? '<div style="background:#fff9c4;border-left:3px solid #f59e0b;padding:6px 10px;border-radius:3px;font-weight:bold;font-size:12px;margin-bottom:4px">' + dx1 + '</div>'
      : '';

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
