import { useApp } from '../context/AppContext';

// Reporte limpio para imprimir — mínimo color, máximo legibilidad
// El logo va horizontal y carga imagen del sello/firma

export default function ReportePreview({ cito, dx, onPrint, onGuardarDrive }) {
  const { config } = useApp();

  const hoy = new Date().toLocaleDateString('es-SV', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const c = config || {};
  const labNombre   = c['LAB_NOMBRE']    || 'Centro Citodiagnóstico de la Mujer';
  const labTel      = c['LAB_TELEFONO']  || '';
  const labEmail    = c['LAB_EMAIL']     || '';
  const labDir      = c['LAB_DIRECCION'] || '';
  const labLogo     = c['LAB_LOGO_URL']  || '';
  const citoNombre  = c['CITO_NOMBRE']   || '';
  const citoTitulo  = c['CITO_TITULO']   || '';
  const citoColegia = c['CITO_COLEGIADO']|| '';
  const citoCargo   = c['CITO_CARGO']    || '';
  const citoFirma   = c['CITO_FIRMA_URL']|| '';
  const labSlogan   = c['LAB_SLOGAN']    || 'Diagnóstico confiable en tiempo récord';
  const labNota     = c['REPORTE_NOTA']  || 'NOTA: LÁMINAS SE CONSERVARÁN ÚNICAMENTE POR 6 MESES DESPUÉS DE RECIBIDA LA MUESTRA.';

  // Diagnóstico auto-generado (las 4 líneas editables vienen de dx)
  const dx1 = dx?.dx1 || dx?.interpretacion || '';
  const dx2 = dx?.dx2 || '';
  const dx3 = dx?.dx3 || '';
  const dx4 = dx?.dx4 || '';

  return (
    <div>
      {/* Controles de acción — se ocultan al imprimir */}
      <div className="btn-group no-print" style={{ justifyContent:'center', marginBottom:18 }}>
        <button className="btn" onClick={onPrint}>
          🖨️ Imprimir (2 copias)
        </button>
        <button className="btn btn-primary" onClick={onGuardarDrive}>
          ☁️ Guardar en Drive + marcar REALIZADO
        </button>
      </div>

      {/* ── EL REPORTE ─────────────────────────────────────────── */}
      <div className="reporte-hoja" id="reporte-imprimible">

        {/* ENCABEZADO — logo horizontal + datos de contacto */}
        <div className="reporte-header">
          <div className="reporte-logo-area">
            {labLogo
              ? <img src={labLogo} alt="Logo" className="reporte-logo-img"/>
              : <div className="reporte-logo-placeholder">{labNombre.slice(0,2)}</div>
            }
          </div>
          <div className="reporte-contacto">
            <div className="reporte-contacto-item">📞 {labTel}</div>
            <div className="reporte-contacto-item">✉️ {labEmail}</div>
            <div className="reporte-contacto-item">📍 {labDir}</div>
          </div>
        </div>

        {/* TÍTULO */}
        <div className="reporte-titulo">REPORTE DE ESTUDIO CITOLÓGICO</div>

        {/* DATOS DEL PACIENTE */}
        <div className="reporte-paciente-grid">
          <div className="reporte-campo">
            <span className="reporte-campo-label">Nombre de la Paciente:</span>
            <span className="reporte-campo-val bold">{cito?.nombre || ''}</span>
          </div>
          <div className="reporte-campo">
            <span className="reporte-campo-label">Refiere:</span>
            <span className="reporte-campo-val bold">{cito?.medico || ''}</span>
          </div>
          <div className="reporte-campo" style={{ textAlign:'right' }}>
            <span className="reporte-campo-label">N° Citología:</span>
            <span className="reporte-campo-val bold rosa">{cito?.idCito || ''}</span>
          </div>
          <div className="reporte-campo">
            <span className="reporte-campo-label">Edad:</span>
            <span className="reporte-campo-val">{cito?.edad ? cito.edad + ' AÑOS' : ''}</span>
          </div>
          <div className="reporte-campo">
            <span className="reporte-campo-label">Fecha de recepción:</span>
            <span className="reporte-campo-val">{cito?.fecha || ''}</span>
          </div>
          <div className="reporte-campo">
            <span className="reporte-campo-label">Fecha de reporte:</span>
            <span className="reporte-campo-val">{hoy}</span>
          </div>
          <div className="reporte-campo">
            <span className="reporte-campo-label">Tipo de muestra:</span>
            <span className="reporte-campo-val bold">{dx?.tipoMuestra || 'EXTENDIDO CONVENCIONAL'}</span>
          </div>
          <div className="reporte-campo">
            <span className="reporte-campo-label">Muestra recibida:</span>
            <span className="reporte-campo-val bold">{cito?.muestra || ''}</span>
          </div>
        </div>

        {/* CALIDAD DE MUESTRA */}
        <div className="reporte-linea-calidad">
          {dx?.calidad || ''}
        </div>

        {/* SECCIÓN: INTERPRETACIÓN */}
        <div className="reporte-seccion">
          <div className="reporte-seccion-titulo">INTERPRETACIÓN DE RESULTADOS:</div>
          <div className="reporte-seccion-body">{dx?.interpretacion || ''}</div>
        </div>

        {/* SECCIÓN: HALLAZGOS NO NEOPLÁSICOS */}
        <div className="reporte-seccion">
          <div className="reporte-seccion-titulo">HALLAZGOS NO NEOPLÁSICOS:</div>
          <div className="reporte-hallazgos">
            <div className="reporte-hallazgo-fila">
              <span className="reporte-hallazgo-key">VARIACIONES CELULARES NO NEOPLÁSICOS:</span>
              <span className="reporte-hallazgo-val">{dx?.variaciones || ''}</span>
            </div>
            <div className="reporte-hallazgo-fila">
              <span className="reporte-hallazgo-key">CAMBIOS CELULARES REACTIVOS ASOCIADOS A:</span>
              <span className="reporte-hallazgo-val">{dx?.cambiosReactivos || ''}</span>
            </div>
            <div className="reporte-hallazgo-fila">
              <span className="reporte-hallazgo-key">FLORA BACTERIANA:</span>
              <span className="reporte-hallazgo-val">{dx?.flora || ''}</span>
            </div>
            <div className="reporte-hallazgo-fila">
              <span className="reporte-hallazgo-key">MICROORGANISMOS:</span>
              <span className="reporte-hallazgo-val">{dx?.microorganismos || ''}</span>
            </div>
          </div>
          {dx?.anomaliaDetalle && (
            <div style={{ marginTop:6, fontSize:'10px' }}>
              <strong>Anomalía:</strong> {dx.anomaliaDetalle}
            </div>
          )}
          {dx?.ascAtipicas && (
            <div style={{ marginTop:4, fontSize:'10px' }}>
              <strong>Células atípicas:</strong> {dx.ascAtipicas}
            </div>
          )}
        </div>

        {/* OBSERVACIONES */}
        {dx?.observaciones && dx.observaciones !== 'SIN OBSERVACIONES' && (
          <div style={{ fontSize:'11px', margin:'6px 0', color:'#333' }}>{dx.observaciones}</div>
        )}
        {(!dx?.observaciones || dx.observaciones === 'SIN OBSERVACIONES') && (
          <div style={{ fontSize:'11px', margin:'6px 0', color:'#555' }}>SIN OBSERVACIONES</div>
        )}

        {/* SECCIÓN: DIAGNÓSTICO */}
        <div className="reporte-seccion">
          <div className="reporte-seccion-titulo">DIAGNÓSTICO:</div>
          <div className="reporte-seccion-body">
            {dx1 && <div>{dx1}</div>}
            {dx2 && <div>{dx2}</div>}
            {dx3 && <div>{dx3}</div>}
            {dx4 && <div>{dx4}</div>}
          </div>
        </div>

        {/* SECCIÓN: COMENTARIOS */}
        <div className="reporte-seccion-titulo-standalone">COMENTARIOS Y SUGERENCIAS</div>
        <div style={{ fontSize:'11px', lineHeight:1.6, minHeight:40, margin:'4px 0 12px', color:'#333' }}>
          {dx?.comentarios || 'SIN COMENTARIOS RELACIONADOS'}
          {dx?.comentariosLibres && <span><br/>{dx.comentariosLibres}</span>}
        </div>

        {/* FIRMA Y SELLO */}
        <div className="reporte-firma-area">
          <div className="reporte-firma-box">
            {citoFirma
              ? <img src={citoFirma} alt="Firma y sello" className="reporte-firma-img"/>
              : <div className="reporte-firma-vacio">Firma y sello</div>
            }
            <div className="reporte-firma-nombre">{citoNombre}</div>
            <div className="reporte-firma-sub">{citoTitulo}</div>
            <div className="reporte-firma-sub">{citoColegia}</div>
            <div className="reporte-firma-sub">{citoCargo}</div>
          </div>
        </div>

        {/* PIE */}
        <div className="reporte-pie">
          <div className="reporte-slogan">"{labSlogan}"</div>
          <div className="reporte-nota">{labNota}</div>
          <div className="reporte-fecha-rep">Fecha de reporte: {hoy}</div>
        </div>

      </div>

      {/* ── ESTILOS DEL REPORTE (inline para print) ─────────── */}
      <style>{`
        .reporte-hoja {
          max-width: 720px; margin: 0 auto;
          background: #fff; border: 1px solid #ddd;
          border-radius: 6px; overflow: hidden;
          font-family: Arial, sans-serif; font-size: 11px; color: #111;
        }
        .reporte-header {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 14px 20px; border-bottom: 2px solid #802f58;
        }
        .reporte-logo-area { flex-shrink:0 }
        .reporte-logo-img  { height: 60px; max-width:220px; object-fit:contain }
        .reporte-logo-placeholder {
          width:60px; height:60px; border-radius:50%;
          background:#fbeaf0; color:#802f58;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; font-weight:700;
        }
        .reporte-contacto { text-align:right; font-size:10px; line-height:1.8; color:#444 }
        .reporte-contacto-item { display:block }
        .reporte-titulo {
          background: #802f58; color:#fff;
          text-align:center; padding:8px;
          font-size:13px; font-weight:700; letter-spacing:0.08em;
        }
        .reporte-paciente-grid {
          display: grid; grid-template-columns:1fr 1fr 1fr;
          gap:0; border-bottom: 1px solid #ddd; padding: 10px 20px;
        }
        .reporte-campo { padding: 4px 6px }
        .reporte-campo-label { display:block; font-size:9px; text-transform:uppercase; color:#888; letter-spacing:0.05em }
        .reporte-campo-val   { display:block; font-size:11px; color:#111 }
        .reporte-campo-val.bold { font-weight:700 }
        .reporte-campo-val.rosa { color:#802f58; font-size:14px }
        .reporte-linea-calidad { padding:8px 20px; font-size:11px; color:#222; border-bottom:1px solid #eee; background:#fdf9fb }
        .reporte-seccion { padding: 6px 20px }
        .reporte-seccion-titulo {
          display:inline-block; background:#f0dde7; color:#802f58;
          font-size:10px; font-weight:700; text-transform:uppercase;
          letter-spacing:0.06em; padding:3px 10px; border-radius:3px;
          margin: 8px 0 5px;
        }
        .reporte-seccion-titulo-standalone {
          margin: 8px 20px 0; background:#f0dde7; color:#802f58;
          font-size:10px; font-weight:700; text-transform:uppercase;
          letter-spacing:0.06em; padding:3px 10px; border-radius:3px;
          display:inline-block;
        }
        .reporte-seccion-body { font-size:11px; line-height:1.6; color:#222; padding-left:4px }
        .reporte-hallazgos { display:grid; grid-template-columns:200px 1fr; gap:3px; font-size:10px; margin:4px 0 }
        .reporte-hallazgo-fila { display:contents }
        .reporte-hallazgo-key  { color:#666; padding:2px 0 }
        .reporte-hallazgo-val  { color:#111; padding:2px 0 }
        .reporte-firma-area { display:flex; justify-content:center; padding:20px; border-top:1px solid #eee; margin-top:10px }
        .reporte-firma-box  { text-align:center; border:1px solid #ddd; padding:12px 24px; border-radius:6px }
        .reporte-firma-img  { height:80px; margin-bottom:8px; display:block; margin-left:auto; margin-right:auto }
        .reporte-firma-vacio { height:50px; border-bottom:1px solid #ccc; width:180px; margin:0 auto 8px }
        .reporte-firma-nombre { font-weight:700; font-size:11px }
        .reporte-firma-sub    { font-size:9px; color:#666 }
        .reporte-pie { text-align:center; padding:10px 20px 14px; border-top:1px solid #eee }
        .reporte-slogan { font-style:italic; color:#802f58; font-size:11px }
        .reporte-nota   { font-size:9px; color:#888; margin-top:3px }
        .reporte-fecha-rep { font-size:9px; color:#aaa; margin-top:6px }
        @media print {
          .no-print { display:none !important }
          .reporte-hoja { border:none; border-radius:0; max-width:100% }
          .reporte-titulo, .reporte-seccion-titulo, .reporte-seccion-titulo-standalone { -webkit-print-color-adjust:exact; print-color-adjust:exact }
        }
      `}</style>
    </div>
  );
}
