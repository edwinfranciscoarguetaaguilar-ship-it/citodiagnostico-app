import { useState } from 'react';
import { Microscope, Search, Eye, Save, FileText } from 'lucide-react';
import { Card, Btn, EstatusPill, Spinner } from '../components/UI';
import ReportePreview from '../components/ReportePreview';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

const TIPOS_MUESTRA = ['EXTENDIDO CONVENCIONAL','CITOLOGIA EN BASE LIQUIDA','BIOPSIA','CUPULA VAGINAL'];

const dxVacio = () => ({
  tipoMuestra:'EXTENDIDO CONVENCIONAL',
  calidad:'', interpretacion:'', anomaliaTipo:'', anomaliaDetalle:'',
  variaciones:'', cambiosReactivos:'', flora:'', microorganismos:'',
  ascAtipicas:'', observaciones:'SIN OBSERVACIONES',
  dx1:'', dx2:'', dx3:'', dx4:'',
  comentarios:'SIN COMENTARIOS RELACIONADOS', comentariosLibres:''
});

// Campo de texto/select SIEMPRE editable con opción de lista
function CampoDx({ label, name, value, onChange, opciones=[], textarea=false, span }) {
  const [modo, setModo] = useState('select'); // 'select' | 'texto'

  return (
    <div className={`form-group ${span==='2'?'span2':''}`}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <label className="form-label">{label}</label>
        {opciones.length > 0 && (
          <button type="button" onClick={() => setModo(m => m==='select'?'texto':'select')}
            style={{ fontSize:10, color:'var(--rosa)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
            {modo==='select'?'Escribir libre':'Usar lista'}
          </button>
        )}
      </div>
      {modo==='select' && opciones.length > 0
        ? <select className="form-select" name={name} value={value} onChange={onChange}>
            <option value="">— Seleccionar —</option>
            {opciones.map((o,i) => <option key={i} value={o}>{o}</option>)}
          </select>
        : textarea
          ? <textarea className="form-textarea" name={name} value={value} onChange={onChange} rows={3}/>
          : <input className="form-input" name={name} value={value} onChange={onChange}/>
      }
    </div>
  );
}

export default function Diagnostico() {
  const { diagnosticos, mostrarToast } = useApp();
  const [busqueda,  setBusqueda]  = useState('');
  const [cito,      setCito]      = useState(null);
  const [dx,        setDx]        = useState(dxVacio());
  const [tab,       setTab]       = useState('form'); // 'form' | 'preview'
  const [cargandoBuscar, setCargandoBuscar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [pdfData,   setPdfData]   = useState(null); // { urlPDF, waLink, preferenciaEntrega }

  const d = diagnosticos || {};

  const buscar = async () => {
    if (!busqueda.trim()) return;
    setCargandoBuscar(true);
    try {
      const res = await api.buscarCitologia(busqueda.trim());
      if (!res) { mostrarToast('Citología no encontrada: ' + busqueda, 'error'); return; }
      setCito(res);
      // Pre-llenar diagnóstico si ya existe
      if (res.diagnostico) {
        setDx({ ...dxVacio(), ...res.diagnostico });
      } else {
        setDx(dxVacio());
      }
      setPdfData(null);
      setTab('form');
    } catch(e) {
      mostrarToast('Error buscando: ' + e.message, 'error');
    } finally {
      setCargandoBuscar(false);
    }
  };

  const handleDx = e => {
    const { name, value } = e.target;
    setDx(prev => {
      const nuevo = { ...prev, [name]: value };
      // Auto-generar DX1-DX4 si cambia algún campo clave
      nuevo.dx1 = nuevo.interpretacion || '';
      nuevo.dx2 = (nuevo.microorganismos && nuevo.microorganismos !== 'NINGUNO') ? nuevo.microorganismos : '';
      nuevo.dx3 = (nuevo.cambiosReactivos && nuevo.cambiosReactivos !== 'NO SE EVIDENCIAN CAMBIOS CELULARES REACTIVOS') ? nuevo.cambiosReactivos : '';
      nuevo.dx4 = nuevo.anomaliaDetalle || '';
      return nuevo;
    });
  };

  // DX1-4 son siempre editables directo
  const handleDxField = e => {
    const { name, value } = e.target;
    setDx(prev => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    if (!cito) { mostrarToast('Cargá una citología primero', 'error'); return; }
    setGuardando(true);
    try {
      await api.guardarDiagnostico({
        idCito:           cito.idCito,
        nombre:           cito.nombre,
        medico:           cito.medico,
        edad:             cito.edad,
        fechaRecepcion:   cito.fecha,
        tipoMuestra:      dx.tipoMuestra,
        muestraRecibida:  cito.muestra,
        ...dx
      });
      mostrarToast('Diagnóstico guardado correctamente');
      setCito(c => ({ ...c, estatus:'REALIZADO' }));
    } catch(e) {
      mostrarToast('Error guardando: ' + e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const generarPDF = async () => {
    if (!cito) return;
    setGenerandoPDF(true);
    try {
      const res = await api.generarPDF(cito.idCito);
      setPdfData(res);
      mostrarToast('PDF generado en Drive');
      setTab('preview');
    } catch(e) {
      mostrarToast('Error generando PDF: ' + e.message, 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const imprimir = () => window.print();

  return (
    <div className="fade-in">
      {/* ── BÚSQUEDA ── */}
      <Card>
        <div style={{ padding:'16px 20px', display:'flex', gap:10, alignItems:'center', borderBottom:'1px solid var(--border)' }}>
          <div className="search-wrap" style={{ flex:1 }}>
            <Search className="search-icon" size={16}/>
            <input
              className="form-input"
              placeholder="Buscar por # citología (ej: 3043-26) o nombre de paciente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key==='Enter' && buscar()}
            />
          </div>
          <Btn variant="primary" onClick={buscar} disabled={cargandoBuscar}>
            {cargandoBuscar ? <Spinner/> : 'Cargar'}
          </Btn>
          <Btn onClick={async () => {
            try {
              const pend = await api.getCitologiasPendientes();
              if (pend.length > 0) { setBusqueda(pend[0].idCito); }
            } catch {}
          }}>
            Ver pendientes
          </Btn>
        </div>

        {/* Datos del paciente */}
        {cito && (
          <div className="patient-bar">
            <div>
              <div className="info-label"># Citología</div>
              <div className="info-val" style={{ color:'var(--rosa)', fontSize:16 }}>{cito.idCito}</div>
            </div>
            <div>
              <div className="info-label">Paciente</div>
              <div className="info-val">{cito.nombre}</div>
            </div>
            <div>
              <div className="info-label">Edad · Fecha recepción</div>
              <div className="info-val">{cito.edad} años · {cito.fecha}</div>
            </div>
            <div>
              <div className="info-label">Médico · Muestra · Estatus</div>
              <div className="info-val" style={{ display:'flex', alignItems:'center', gap:6 }}>
                {cito.medico} · {cito.muestra} <EstatusPill estatus={cito.estatus}/>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── FORMULARIO / PREVIEW ── */}
      {cito && (
        <Card>
          <div className="tabs">
            <button className={`tab-btn ${tab==='form'?'active':''}`} onClick={() => setTab('form')}>
              <Microscope size={14}/> Llenar diagnóstico
            </button>
            <button className={`tab-btn ${tab==='preview'?'active':''}`} onClick={() => setTab('preview')}>
              <Eye size={14}/> Vista previa del reporte
            </button>
          </div>

          {/* ───── TAB FORMULARIO ───── */}
          {tab === 'form' && (
            <div>
              <div className="form-grid" style={{ padding:20 }}>

                {/* Tipo de muestra */}
                <div className="form-group">
                  <label className="form-label">Tipo de muestra</label>
                  <select className="form-select" name="tipoMuestra" value={dx.tipoMuestra} onChange={handleDx}>
                    {TIPOS_MUESTRA.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-section-title">Calidad e interpretación de la muestra</div>

                <CampoDx span="2" label="Calidad de la muestra" name="calidad" value={dx.calidad} onChange={handleDx}
                  opciones={d.calidadMuestra||[]}/>

                <CampoDx span="2" label="Interpretación / Resultado" name="interpretacion" value={dx.interpretacion} onChange={handleDx}
                  opciones={d.interpretacion||[]}/>

                {/* Anomalías — solo si interpretación lo requiere */}
                {(dx.interpretacion === 'ANOMALIAS EPITELIALES ESCAMOSAS' ||
                  dx.interpretacion === 'ANOMALIAS EPITELIALES GLANDULARES' ||
                  dx.interpretacion === 'NEOPLASIA INTRAEPITELIAL VAGINAL (VAIN)') && (<>
                  <div className="form-section-title">Anomalías epiteliales</div>
                  <CampoDx label="Tipo de anomalía" name="anomaliaTipo" value={dx.anomaliaTipo} onChange={handleDx}
                    opciones={[...new Set(d.anomaliaTipo||[])]}/>
                  <CampoDx label="Detalle de la anomalía" name="anomaliaDetalle" value={dx.anomaliaDetalle} onChange={handleDx}
                    opciones={d.anomaliaDetalle||[]}/>
                  <CampoDx span="2" label="Células escamosas atípicas (ASC)" name="ascAtipicas" value={dx.ascAtipicas} onChange={handleDx}
                    opciones={d.ascAtipicas||[]}/>
                </>)}

                <div className="form-section-title">Hallazgos no neoplásicos</div>

                <CampoDx label="Variaciones celulares no neoplásicas" name="variaciones" value={dx.variaciones} onChange={handleDx}
                  opciones={d.variaciones||[]}/>
                <CampoDx label="Cambios celulares reactivos asociados a" name="cambiosReactivos" value={dx.cambiosReactivos} onChange={handleDx}
                  opciones={d.cambiosReactivos||[]}/>
                <CampoDx label="Flora bacteriana" name="flora" value={dx.flora} onChange={handleDx}
                  opciones={d.flora||[]}/>
                <CampoDx label="Microorganismos" name="microorganismos" value={dx.microorganismos} onChange={handleDx}
                  opciones={d.microorganismos||[]}/>

                <div className="form-section-title">Diagnóstico final (editables)</div>

                {/* DX1-DX4 siempre editables */}
                {[1,2,3,4].map(n => (
                  <div key={n} className="form-group span2">
                    <label className="form-label">Diagnóstico línea {n} {n===1?'(principal)':n===4?'(opcional)':''}</label>
                    <textarea className="form-textarea" name={`dx${n}`} value={dx[`dx${n}`]}
                      onChange={handleDxField} rows={2}
                      placeholder={n===1?'Se auto-completa con la interpretación — editable':n>2?'Opcional':''} />
                  </div>
                ))}

                <div className="form-section-title">Observaciones y comentarios</div>

                <CampoDx span="2" textarea label="Observaciones" name="observaciones" value={dx.observaciones} onChange={handleDx}
                  opciones={['SIN OBSERVACIONES']}/>

                <CampoDx span="2" label="Comentarios y sugerencias" name="comentarios" value={dx.comentarios} onChange={handleDx}
                  opciones={d.comentarios||[]}/>

                <div className="form-group span2">
                  <label className="form-label">Comentarios libres adicionales</label>
                  <textarea className="form-textarea" name="comentariosLibres" value={dx.comentariosLibres}
                    onChange={handleDxField} rows={2} placeholder="Texto libre adicional del citólogo..."/>
                </div>

              </div>

              <div className="form-actions">
                <Btn onClick={() => setTab('preview')} icon={Eye}>Vista previa</Btn>
                <Btn variant="primary" icon={Save} onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar diagnóstico'}
                </Btn>
              </div>
            </div>
          )}

          {/* ───── TAB PREVIEW ───── */}
          {tab === 'preview' && (
            <div style={{ padding:20, background:'var(--bg)' }}>
              <ReportePreview
                cito={cito}
                dx={dx}
                onPrint={imprimir}
                onGuardarDrive={generarPDF}
              />

              {/* Acciones post-PDF */}
              {pdfData && (
                <div style={{ marginTop:16, padding:14, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#065f46', marginBottom:8 }}>
                    ✅ PDF generado correctamente
                  </div>
                  <div className="btn-group">
                    {pdfData.urlPDF && (
                      <a href={pdfData.urlPDF} target="_blank" rel="noreferrer" className="btn btn-sm">
                        Ver PDF en Drive
                      </a>
                    )}
                    {pdfData.waLink && (
                      <a href={pdfData.waLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        📱 Enviar por WhatsApp
                      </a>
                    )}
                    {(pdfData.preferenciaEntrega === 'IMPRESO' || pdfData.preferenciaEntrega === 'AMBOS') && (
                      <Btn size="sm" onClick={imprimir}>🖨️ Imprimir</Btn>
                    )}
                  </div>
                </div>
              )}

              {!pdfData && (
                <div className="form-actions" style={{ justifyContent:'center' }}>
                  <Btn icon={Save} onClick={guardar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar diagnóstico'}
                  </Btn>
                  <Btn variant="primary" onClick={generarPDF} disabled={generandoPDF}>
                    {generandoPDF ? 'Generando...' : '☁️ Guardar en Drive + REALIZADO'}
                  </Btn>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {!cito && (
        <div style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>
          <Microscope size={40} style={{ opacity:.2, margin:'0 auto 12px', display:'block' }}/>
          <p>Buscá una citología por su número o nombre de paciente para comenzar el diagnóstico.</p>
        </div>
      )}
    </div>
  );
}
