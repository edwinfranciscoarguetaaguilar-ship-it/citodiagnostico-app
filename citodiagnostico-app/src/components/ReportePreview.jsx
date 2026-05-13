import { useApp } from '../context/AppContext';

// Convierte URL de Drive a URL directa de imagen
function driveImg(url) {
  if (!url) return '';
  if (url.includes('uc?')) return url;
  const match = url.match(/[-\w]{25,}/);
  return match ? `https://drive.google.com/uc?export=view&id=${match[0]}` : url;
}

// Imprime solo el reporte abriendo ventana nueva
function imprimirReporte(contenidoId) {
  const el = document.getElementById(contenidoId);
  if (!el) { window.print(); return; }

  const ventana = window.open('', '_blank', 'width=800,height=900');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte Citológico</title>
      <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        body { margin: 0; padding: 16px; font-family: Arial, sans-serif; background: #fff; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      ${el.outerHTML}
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
  ventana.document.close();
}

export default function ReportePreview({ cito, dx, onPrint, onGuardarDrive }) {
  const { config } = useApp();
  const c = config || {};

  const labNombre  = c['LAB_NOMBRE']    || 'Centro Citodiagnóstico de la Mujer';
  const labTel     = c['LAB_TELEFONO']  || '';
  const labEmail   = c['LAB_EMAIL']     || '';
  const labDir     = c['LAB_DIRECCION'] || '';
  const labLogo    = driveImg(c['LAB_LOGO_URL'] || '');
  const citoNombre = c['CITO_NOMBRE']   || '';
  const citoTitulo = c['CITO_TITULO']   || '';
  const citoColegiado = c['CITO_COLEGIADO'] || '';
  const citoCargo  = c['CITO_CARGO']    || '';
  const citoFirma  = driveImg(c['CITO_FIRMA_URL'] || '');
  const labSlogan  = c['LAB_SLOGAN']    || 'Diagnóstico confiable en tiempo récord';
  const labNota    = c['REPORTE_NOTA']  || 'NOTA: LÁMINAS SE CONSERVARÁN ÚNICAMENTE POR 6 MESES DESPUÉS DE RECIBIDA LA MUESTRA.';

  const ahora = new Date();
  const fechaReporte = ahora.toLocaleDateString('es-SV', { day:'2-digit', month:'2-digit', year:'numeric' })
    + ' ' + ahora.toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit' });

  const dx1 = dx?.dx1 || dx?.interpretacion || '';
  const dx2 = dx?.dx2 || '';
  const dx3 = dx?.dx3 || '';
  const dx4 = dx?.dx4 || '';

  const esLiquida = cito?.muestra === 'CITOLOGIA LIQUIDA';

  return (
    <div>
      {/* Botones — se ocultan al imprimir */}
      <div className="btn-group no-print" style={{ justifyContent:'center', marginBottom:18 }}>
        <button className="btn" onClick={() => imprimirReporte('reporte-imprimible')}>🖨️ Imprimir</button>
        <button className="btn btn-primary" onClick={onGuardarDrive}>☁️ Guardar en Drive + marcar REALIZADO</button>
      </div>

      {/* ── HOJA DEL REPORTE ─────────────────────────────────── */}
      <div id="reporte-imprimible" style={{
        maxWidth: 680, margin:'0 auto',
        background:'#fff', border:'1px solid #ccc',
        fontFamily:'Arial, sans-serif', fontSize:'11px', color:'#111'
      }}>

        {/* ENCABEZADO — logo horizontal a la izquierda, contacto a la derecha */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'2px solid #802f58' }}>
          <div style={{ flex:1 }}>
            {labLogo
              ? <img src={labLogo} alt="Logo" style={{ maxHeight:65, maxWidth:220, objectFit:'contain' }} onError={e=>e.target.style.display='none'}/>
              : <div style={{ fontWeight:'bold', fontSize:14, color:'#802f58' }}>{labNombre}</div>
            }
          </div>
          <div style={{ textAlign:'right', fontSize:'10px', color:'#444', lineHeight:1.9 }}>
            {labTel && <div>📞 {labTel}</div>}
            {labEmail && <div>✉️ {labEmail}</div>}
            {labDir && <div>📍 {labDir}</div>}
          </div>
        </div>

        {/* TÍTULO */}
        <div style={{ background:'#802f58', color:'#fff', textAlign:'center', padding:'7px', fontSize:'12px', fontWeight:'bold', letterSpacing:'0.08em' }}>
          REPORTE DE ESTUDIO CITOLÓGICO
        </div>

        {/* DATOS DEL PACIENTE */}
        <div style={{ padding:'10px 18px', borderBottom:'1px solid #ddd' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px 16px' }}>
            <div>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888', letterSpacing:'0.05em' }}>Nombre de la Paciente:</div>
              <div style={{ fontWeight:'bold', fontSize:'12px' }}>{cito?.nombre || ''}</div>
            </div>
            <div>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888' }}>Refiere:</div>
              <div style={{ fontWeight:'bold', fontSize:'11px' }}>{cito?.medico || ''}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888' }}>N° Citología:</div>
              <div style={{ fontWeight:'bold', fontSize:'16px', color:'#802f58' }}>{cito?.idCito || ''}</div>
            </div>
            <div>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888' }}>Edad:</div>
              <div style={{ fontWeight:'500' }}>{cito?.edad ? cito.edad + ' AÑOS' : ''}</div>
            </div>
            <div>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888', fontWeight:'bold', color:'#802f58' }}>TIPO DE MUESTRA:</div>
              <div style={{ fontWeight:'bold', color:'#802f58' }}>{dx?.tipoMuestra || 'EXTENDIDO CONVENCIONAL'}</div>
            </div>
            <div>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888', fontWeight:'bold', color:'#802f58' }}>MUESTRA RECIBIDA</div>
              <div style={{ fontWeight:'bold', color: esLiquida?'#1e40af':'#802f58' }}>{cito?.muestra || ''}</div>
            </div>
            <div>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888' }}>Fecha de Recepción:</div>
              <div>{cito?.fecha || ''}</div>
            </div>
            <div>
              <div style={{ fontSize:'9px', textTransform:'uppercase', color:'#888' }}>Fecha de Reporte:</div>
              <div>{fechaReporte}</div>
            </div>
          </div>
        </div>

        {/* Indicador líquida */}
        {esLiquida && (
          <div style={{ background:'#eff6ff', borderBottom:'1px solid #bfdbfe', padding:'4px 18px', fontSize:'10px', fontWeight:'bold', color:'#1e40af' }}>
            💧 CITOLOGÍA EN BASE LÍQUIDA
          </div>
        )}

        {/* CALIDAD DE MUESTRA */}
        <div style={{ padding:'8px 18px', borderBottom:'1px solid #eee', fontSize:'11px', background:'#fdf9fb' }}>
          {dx?.calidad || ''}
        </div>

        {/* INTERPRETACIÓN */}
        <div style={{ padding:'4px 18px 0' }}>
          <div style={{ background:'#802f58', color:'#fff', fontSize:'10px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 10px', borderRadius:3, display:'inline-block', margin:'8px 0 5px' }}>
            INTERPRETACIÓN DE RESULTADOS:
          </div>
          <div style={{ fontSize:'11px', lineHeight:1.6, paddingLeft:4, paddingBottom:6 }}>{dx1}</div>
        </div>

        {/* HALLAZGOS NO NEOPLÁSICOS */}
        <div style={{ padding:'0 18px' }}>
          <div style={{ background:'#802f58', color:'#fff', fontSize:'10px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 10px', borderRadius:3, display:'inline-block', margin:'8px 0 6px' }}>
            HALLAZGOS NO NEOPLÁSICOS:
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'190px 1fr', gap:'3px 8px', fontSize:'11px', paddingBottom:6 }}>
            <span style={{ color:'#666' }}>VARIACIONES CELULARES NO NEOPLÁSICOS:</span>
            <span>{dx?.variaciones || ''}</span>
            <span></span>
            <span>{dx?.cambiosReactivos || ''}</span>
            <span style={{ color:'#666' }}>FLORA BACTERIANA:</span>
            <span>{dx?.flora || ''}</span>
            <span style={{ color:'#666' }}>MICROORGANISMOS:</span>
            <span>{dx?.microorganismos || ''}</span>
          </div>
          {dx?.observaciones && dx.observaciones !== 'SIN OBSERVACIONES' && (
            <div style={{ fontSize:'11px', paddingBottom:6 }}>{dx.observaciones}</div>
          )}
          {(!dx?.observaciones || dx.observaciones === 'SIN OBSERVACIONES') && (
            <div style={{ fontSize:'11px', paddingBottom:6, color:'#555' }}>SIN OBSERVACIONES</div>
          )}
        </div>

        {/* DIAGNÓSTICO */}
        <div style={{ padding:'0 18px' }}>
          <div style={{ background:'#802f58', color:'#fff', fontSize:'10px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 10px', borderRadius:3, display:'inline-block', margin:'8px 0 6px' }}>
            DIAGNÓSTICO:
          </div>
          <div style={{ fontSize:'11px', lineHeight:1.8, paddingBottom:8 }}>
            {dx1 && <div>{dx1}</div>}
            {dx2 && <div>{dx2}</div>}
            {dx3 && <div>{dx3}</div>}
            {dx4 && <div>{dx4}</div>}
          </div>
        </div>

        {/* COMENTARIOS */}
        <div style={{ padding:'0 18px 10px' }}>
          <div style={{ background:'#802f58', color:'#fff', fontSize:'10px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 10px', borderRadius:3, display:'inline-block', margin:'8px 0 6px' }}>
            COMENTARIOS Y SUGERENCIAS
          </div>
          <div style={{ fontSize:'11px', lineHeight:1.6, minHeight:32 }}>
            {dx?.comentarios || 'SIN COMENTARIOS RELACIONADOS'}
            {dx?.comentariosLibres && <div style={{ marginTop:4 }}>{dx.comentariosLibres}</div>}
          </div>
        </div>

        {/* FIRMA Y SELLO */}
        <div style={{ display:'flex', justifyContent:'center', padding:'16px 18px', borderTop:'1px solid #eee' }}>
          <div style={{ textAlign:'center', border:'1px solid #ddd', padding:'10px 28px', borderRadius:6, minWidth:200 }}>
            {citoFirma
              ? <img src={citoFirma} alt="Firma y sello" style={{ maxHeight:90, maxWidth:220, objectFit:'contain', display:'block', margin:'0 auto 8px' }} onError={e=>e.target.style.display='none'}/>
              : <div style={{ height:50, borderBottom:'1px solid #ccc', width:180, margin:'0 auto 8px' }}/>
            }
            <div style={{ fontWeight:'bold', fontSize:'11px' }}>{citoNombre}</div>
            <div style={{ fontSize:'9px', color:'#666' }}>{citoTitulo}</div>
            <div style={{ fontSize:'9px', color:'#666' }}>{citoColegiado}</div>
            <div style={{ fontSize:'9px', color:'#666', fontWeight:'bold' }}>{citoCargo}</div>
          </div>
        </div>

        {/* PIE */}
        <div style={{ textAlign:'center', padding:'8px 18px 12px', borderTop:'1px solid #eee' }}>
          <div style={{ fontStyle:'italic', color:'#802f58', fontSize:'12px', fontWeight:'bold' }}>
            "{labSlogan}"
          </div>
          <div style={{ fontSize:'9px', color:'#888', marginTop:4 }}>{labNota}</div>
          <div style={{ fontSize:'9px', color:'#aaa', marginTop:6 }}>Fecha de reporte: {fechaReporte}</div>
        </div>

      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #reporte-imprimible {
            max-width: 100% !important;
            border: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
