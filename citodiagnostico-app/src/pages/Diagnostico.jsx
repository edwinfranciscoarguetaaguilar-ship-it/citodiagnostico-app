import { useState, useRef } from 'react';
import { Search, Eye, Save, FileText, Phone, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Btn, EstatusPill, Spinner } from '../components/UI';
import ReportePreview from '../components/ReportePreview';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

const TIPOS_MUESTRA = [
  'EXTENDIDO CONVENCIONAL','CITOLOGIA EN BASE LIQUIDA','BIOPSIA','CUPULA VAGINAL'
];

const dxVacio = () => ({
  tipoMuestra:'EXTENDIDO CONVENCIONAL',
  calidad:'', interpretacion:'', anomaliaTipo:'', anomaliaDetalle:'',
  variaciones:'', cambiosReactivos:'', flora:'', microorganismos:'',
  ascAtipicas:'', observaciones:'SIN OBSERVACIONES',
  dx1:'', dx2:'', dx3:'', dx4:'',
  comentarios:'SIN COMENTARIOS RELACIONADOS', comentariosLibres:''
});

function CampoDx({ label, name, value, onChange, opciones=[], textarea=false, span, highlight }) {
  const [abierto, setAbierto] = useState(false);
  const seleccionar = (o) => { onChange({ target:{ name, value:o } }); setAbierto(false); };
  return (
    <div className={`form-group ${span==='2'?'span2':''}`}>
      <label className="form-label" style={{ color: highlight?'var(--rosa)':'' }}>{label}</label>
      <div style={{ position:'relative' }}>
        {textarea
          ? <textarea className="form-textarea" name={name} value={value} onChange={onChange} rows={2}/>
          : <div style={{ display:'flex', gap:4 }}>
              <input className="form-input" name={name} value={value} onChange={onChange} style={{ flex:1, borderColor:highlight?'var(--rosa-light)':'' }}/>
              {opciones.length>0 && (
                <button type="button" onClick={()=>setAbierto(!abierto)}
                  style={{ padding:'0 8px', border:'1px solid var(--border)', borderRadius:7, background:'var(--rosa-pale)', color:'var(--rosa)', cursor:'pointer', flexShrink:0 }}>
                  {abierto?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                </button>
              )}
            </div>
        }
        {abierto && opciones.length>0 && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'#fff', border:'1px solid var(--border)', borderRadius:8, boxShadow:'var(--shadow)', maxHeight:220, overflowY:'auto' }}>
            {opciones.map((o,i)=>(
              <div key={i} onMouseDown={()=>seleccionar(o)}
                style={{ padding:'8px 12px', cursor:'pointer', fontSize:12, borderBottom:'1px solid #fdf4f8', color:'var(--text-2)', lineHeight:1.4 }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--rosa-paler)'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                {o}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Diagnostico() {
  const { diagnosticos, medicos, mostrarToast } = useApp();
  const [busqueda, setBusqueda]   = useState('');
  const [cito, setCito]           = useState(null);
  const [dx, setDx]               = useState(dxVacio());
  const [tab, setTab]             = useState('form');
  const [cargandoBuscar, setCargandoBuscar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [pdfData, setPdfData]     = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [mostraPendientes, setMostraPendientes] = useState(false);
  const [cargandoPend, setCargandoPend] = useState(false);
  const [waNumeroEdit, setWaNumeroEdit] = useState('');
  const [editandoWa, setEditandoWa] = useState(false);

  const d = diagnosticos || {};

  const actualizarDX = (nuevo) => {
    nuevo.dx1 = nuevo.interpretacion || '';
    const items = [];
    if (nuevo.microorganismos && nuevo.microorganismos !== 'NINGUNO') items.push(nuevo.microorganismos);
    if (nuevo.cambiosReactivos && nuevo.cambiosReactivos !== 'NO SE EVIDENCIAN CAMBIOS CELULARES REACTIVOS') items.push(nuevo.cambiosReactivos);
    if (nuevo.anomaliaDetalle) items.push(nuevo.anomaliaDetalle);
    nuevo.dx2 = items[0] || '';
    nuevo.dx3 = items[1] || '';
    nuevo.dx4 = items[2] || '';
    return nuevo;
  };

  const handleDx = e => {
    const { name, value } = e.target;
    setDx(prev => actualizarDX({ ...prev, [name]:value }));
  };

  const handleDxDirecto = e => {
    const { name, value } = e.target;
    setDx(prev => ({ ...prev, [name]:value }));
  };

  const buscar = async (id) => {
    const idBuscar = id || busqueda.trim();
    if (!idBuscar) return;
    setCargandoBuscar(true);
    setMostraPendientes(false);
    try {
      const res = await api.buscarCitologia(idBuscar);
      if (!res) { mostrarToast('No encontrada: ' + idBuscar, 'error'); return; }
      setCito(res);
      setBusqueda(res.idCito);
      setDx(res.diagnostico ? { ...dxVacio(), ...res.diagnostico } : dxVacio());
      setPdfData(null);
      setTab('form');
      const med = medicos.find(m => m.nombre === res.medico);
      setWaNumeroEdit(med?.whatsapp || '');
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setCargandoBuscar(false);
    }
  };

  const verPendientes = async () => {
    if (mostraPendientes) { setMostraPendientes(false); return; }
    setCargandoPend(true);
    try {
      const res = await api.getCitologiasPendientes();
      setPendientes(res || []);
      setMostraPendientes(true);
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setCargandoPend(false);
    }
  };

  const guardar = async () => {
    if (!cito) { mostrarToast('Cargá una citología primero', 'error'); return; }
    setGuardando(true);
    try {
      await api.guardarDiagnostico({
        idCito:cito.idCito, nombre:cito.nombre, medico:cito.medico,
        edad:cito.edad, fechaRecepcion:cito.fecha,
        tipoMuestra:dx.tipoMuestra, muestraRecibida:cito.muestra, ...dx
      });
      mostrarToast('Diagnóstico guardado');
      setCito(c => ({ ...c, estatus:'REALIZADO' }));
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
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
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const abrirWhatsApp = () => {
    if (!pdfData?.urlPDF) return;
    const numero = waNumeroEdit.replace(/\D/g,'');
    if (!numero) { mostrarToast('Agregá el número de WhatsApp', 'error'); return; }
    const msg = `Estimado/a doctor/a, le compartimos el resultado de citología de la paciente: ${cito?.nombre} (${cito?.idCito}): ${pdfData.urlPDF}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
    api.marcarEnviado(cito.idCito).catch(()=>{});
  };

  const marcarBiopsiaEnviada = async () => {
    if (!cito) return;
    try {
      await api.actualizarCitologia({ idCito:cito.idCito, estatus:'REALIZADO', pagado:cito.pagado });
      mostrarToast('Biopsia marcada como enviada');
      setCito(c => ({ ...c, estatus:'REALIZADO' }));
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    }
  };

  const esBiopsia = cito?.muestra === 'BIOPSIA';
  const esLiquida = cito?.muestra === 'CITOLOGIA LIQUIDA';

  return (
    <div className="fade-in">
      <Card style={{ marginBottom:18 }}>
        <div style={{ padding:'16px 20px', display:'flex', gap:10, alignItems:'center', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
          <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
            <Search className="search-icon" size={16}/>
            <input className="form-input" placeholder="# citología o nombre de paciente..."
              value={busqueda} onChange={e=>setBusqueda(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&buscar()}/>
          </div>
          <Btn variant="primary" onClick={()=>buscar()} disabled={cargandoBuscar}>
            {cargandoBuscar?<Spinner/>:'Cargar'}
          </Btn>
          <Btn onClick={verPendientes} disabled={cargandoPend}>
            {cargandoPend?<Spinner/>:mostraPendientes?'Ocultar pendientes':'Ver pendientes'}
          </Btn>
        </div>

        {mostraPendientes && (
          <div style={{ borderBottom:'1px solid var(--border)' }}>
            {pendientes.length===0
              ? <div style={{ padding:'16px 20px', color:'var(--text-3)', fontSize:13 }}>✅ No hay pendientes</div>
              : <div className="table-wrap">
                  <table>
                    <thead><tr><th># Cito</th><th>Paciente</th><th>Médico</th><th>Muestra</th><th>Fecha</th><th></th></tr></thead>
                    <tbody>
                      {pendientes.map((p,i)=>(
                        <tr key={i}>
                          <td><strong style={{ color:'var(--rosa)' }}>{p.idCito}</strong></td>
                          <td>{p.nombre}</td>
                          <td style={{ fontSize:11 }}>{p.medico}</td>
                          <td>
                            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:12, fontWeight:600,
                              background: p.muestra==='CITOLOGIA LIQUIDA'?'#dbeafe':'var(--rosa-pale)',
                              color: p.muestra==='CITOLOGIA LIQUIDA'?'#1e40af':'var(--rosa)' }}>
                              {p.muestra}
                            </span>
                          </td>
                          <td style={{ fontSize:11 }}>{p.fecha}</td>
                          <td><Btn size="sm" onClick={()=>{buscar(p.idCito);setMostraPendientes(false);}}>Abrir →</Btn></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}

        {cito && (
          <div style={{ padding:'16px 20px', background: esLiquida?'#eff6ff':esBiopsia?'#fef3c7':'var(--rosa-paler)', borderBottom:'1px solid var(--border)' }}>
            {(esLiquida||esBiopsia) && (
              <div style={{ display:'inline-block', marginBottom:10, padding:'3px 12px', borderRadius:20,
                background: esLiquida?'#1e40af':'#92400e', color:'#fff', fontSize:11, fontWeight:700 }}>
                {esLiquida?'💧 CITOLOGÍA LÍQUIDA':'🔬 BIOPSIA — Se envía a laboratorio externo'}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
              <div><div className="info-label"># Citología</div><div className="info-val" style={{ color:'var(--rosa)', fontSize:18, fontWeight:700 }}>{cito.idCito}</div></div>
              <div><div className="info-label">Paciente</div><div className="info-val">{cito.nombre}</div></div>
              <div><div className="info-label">Edad</div><div className="info-val">{cito.edad} años</div></div>
              <div><div className="info-label">Estatus</div><div className="info-val"><EstatusPill estatus={cito.estatus}/></div></div>
              <div><div className="info-label">Médico referidor</div><div className="info-val" style={{ fontWeight:600 }}>{cito.medico}</div></div>
              <div><div className="info-label">Tipo de muestra</div><div className="info-val">{cito.muestra}</div></div>
              <div><div className="info-label">Fecha recepción</div><div className="info-val">{cito.fecha}</div></div>
              <div><div className="info-label">Pago</div><div className="info-val">{cito.pagado}</div></div>
            </div>
          </div>
        )}
      </Card>

      {cito && esBiopsia && (
        <Card>
          <div style={{ padding:24, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔬</div>
            <h3 style={{ fontFamily:'var(--font-serif)', color:'var(--rosa)', marginBottom:8 }}>Biopsia</h3>
            <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:20 }}>
              Las biopsias se envían a laboratorio externo. No se genera reporte aquí.<br/>Solo se registra el cambio de estatus.
            </p>
            {cito.estatus!=='REALIZADO'
              ? <Btn variant="primary" onClick={marcarBiopsiaEnviada}>✅ Marcar como enviada a laboratorio externo</Btn>
              : <div style={{ color:'#0a6640', fontWeight:600 }}>✅ Ya marcada como enviada</div>
            }
          </div>
        </Card>
      )}

      {cito && !esBiopsia && (
        <Card>
          <div className="tabs">
            <button className={`tab-btn ${tab==='form'?'active':''}`} onClick={()=>setTab('form')}><Search size={14}/> Llenar diagnóstico</button>
            <button className={`tab-btn ${tab==='preview'?'active':''}`} onClick={()=>setTab('preview')}><Eye size={14}/> Vista previa</button>
          </div>

          {tab==='form' && (
            <div>
              <div className="dx-form">
                <div className="form-group">
                  <label className="form-label">Tipo de muestra (para el reporte)</label>
                  <select className="form-select" name="tipoMuestra" value={dx.tipoMuestra} onChange={handleDx}>
                    {TIPOS_MUESTRA.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-section-title">Calidad e interpretación</div>
                <CampoDx span="2" label="Calidad de la muestra" name="calidad" value={dx.calidad} onChange={handleDx} opciones={d.calidadMuestra||[]}/>
                <CampoDx span="2" label="Interpretación / Resultado" name="interpretacion" value={dx.interpretacion} onChange={handleDx} opciones={d.interpretacion||[]} highlight/>
                {(dx.interpretacion==='ANOMALIAS EPITELIALES ESCAMOSAS'||dx.interpretacion==='ANOMALIAS EPITELIALES GLANDULARES'||dx.interpretacion==='NEOPLASIA INTRAEPITELIAL VAGINAL (VAIN)')&&(<>
                  <div className="form-section-title">Anomalías epiteliales</div>
                  <CampoDx label="Tipo de anomalía" name="anomaliaTipo" value={dx.anomaliaTipo} onChange={handleDx} opciones={[...new Set(d.anomaliaTipo||[])]}/>
                  <CampoDx label="Detalle de la anomalía" name="anomaliaDetalle" value={dx.anomaliaDetalle} onChange={handleDx} opciones={d.anomaliaDetalle||[]}/>
                  <CampoDx span="2" label="Células escamosas atípicas (ASC)" name="ascAtipicas" value={dx.ascAtipicas} onChange={handleDx} opciones={d.ascAtipicas||[]}/>
                </>)}
                <div className="form-section-title">Hallazgos no neoplásicos</div>
                <CampoDx label="Variaciones celulares" name="variaciones" value={dx.variaciones} onChange={handleDx} opciones={d.variaciones||[]}/>
                <CampoDx label="Cambios celulares reactivos" name="cambiosReactivos" value={dx.cambiosReactivos} onChange={handleDx} opciones={d.cambiosReactivos||[]}/>
                <CampoDx label="Flora bacteriana" name="flora" value={dx.flora} onChange={handleDx} opciones={d.flora||[]}/>
                <CampoDx label="Microorganismos" name="microorganismos" value={dx.microorganismos} onChange={handleDx} opciones={d.microorganismos||[]}/>
                <div className="form-section-title">Diagnóstico final — se pre-llena automáticamente, editá si necesitás</div>
                <div className="span2" style={{ background:'var(--rosa-pale)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--rosa)', lineHeight:1.6 }}>
                  <strong style={{ display:'block', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Preview auto-generado:</strong>
                  {dx.dx1&&<div>{dx.dx1}</div>}{dx.dx2&&<div>{dx.dx2}</div>}{dx.dx3&&<div>{dx.dx3}</div>}{dx.dx4&&<div>{dx.dx4}</div>}
                </div>
                {[1,2,3,4].map(n=>(
                  <div key={n} className="form-group span2">
                    <label className="form-label">Diagnóstico línea {n} {n===1?'(principal)':n>2?'(opcional)':''}</label>
                    <textarea className="form-textarea" name={`dx${n}`} value={dx[`dx${n}`]} onChange={handleDxDirecto} rows={2} style={{ borderColor:n===1?'var(--rosa-light)':'' }}/>
                  </div>
                ))}
                <div className="form-section-title">Observaciones y comentarios</div>
                <CampoDx span="2" textarea label="Observaciones" name="observaciones" value={dx.observaciones} onChange={handleDx} opciones={['SIN OBSERVACIONES']}/>
                <CampoDx span="2" label="Comentarios y sugerencias" name="comentarios" value={dx.comentarios} onChange={handleDx} opciones={d.comentarios||[]}/>
                <div className="form-group span2">
                  <label className="form-label">Comentarios libres adicionales</label>
                  <textarea className="form-textarea" name="comentariosLibres" value={dx.comentariosLibres} onChange={handleDxDirecto} rows={2} placeholder="Texto libre adicional..."/>
                </div>
              </div>
              <div className="form-actions">
                <Btn onClick={()=>setTab('preview')} icon={Eye}>Vista previa</Btn>
                <Btn variant="primary" icon={Save} onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar diagnóstico'}</Btn>
              </div>
            </div>
          )}

          {tab==='preview' && (
            <div style={{ padding:20, background:'var(--bg)' }}>
              <ReportePreview cito={cito} dx={dx} onPrint={()=>window.print()} onGuardarDrive={generarPDF}/>
              {pdfData && (
                <div style={{ marginTop:16, padding:16, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#065f46', marginBottom:12 }}>✅ PDF listo — {pdfData.nombreArchivo}</div>
                  <div style={{ marginBottom:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:12, color:'var(--text-3)' }}>📱 WhatsApp:</span>
                    {editandoWa
                      ? <><input value={waNumeroEdit} onChange={e=>setWaNumeroEdit(e.target.value)} placeholder="+50300000000"
                          style={{ padding:'6px 10px', border:'1px solid var(--border)', borderRadius:7, fontSize:13, width:180 }}/>
                        <Btn size="sm" onClick={()=>setEditandoWa(false)}>OK</Btn></>
                      : <><span style={{ fontSize:13, fontWeight:600 }}>{waNumeroEdit||'Sin número'}</span>
                        <Btn size="sm" onClick={()=>setEditandoWa(true)}>Editar</Btn></>
                    }
                  </div>
                  <div className="btn-group" style={{ flexWrap:'wrap' }}>
                    {pdfData.urlPDF&&<a href={pdfData.urlPDF} target="_blank" rel="noreferrer" className="btn btn-sm">📄 Ver PDF</a>}
                    <Btn size="sm" icon={Printer} onClick={()=>window.print()}>Imprimir</Btn>
                    <button onClick={abrirWhatsApp} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:7, fontSize:12, fontWeight:600, background:'#25d366', color:'#fff', border:'none', cursor:'pointer' }}>
                      <Phone size={14}/> Enviar por WhatsApp
                    </button>
                  </div>
                  {pdfData.preferenciaEntrega&&<div style={{ marginTop:8, fontSize:11, color:'var(--text-3)' }}>Preferencia del médico: <strong>{pdfData.preferenciaEntrega}</strong></div>}
                </div>
              )}
              {!pdfData&&(
                <div className="form-actions" style={{ justifyContent:'center', marginTop:16 }}>
                  <Btn icon={Save} onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</Btn>
                  <Btn variant="primary" onClick={generarPDF} disabled={generandoPDF}>{generandoPDF?'Generando...':'☁️ Guardar en Drive + REALIZADO'}</Btn>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {!cito&&!mostraPendientes&&(
        <div style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>
          <FileText size={40} style={{ opacity:.2, margin:'0 auto 12px', display:'block' }}/>
          <p style={{ fontSize:13 }}>Buscá por # citología o nombre, o usá <strong>"Ver pendientes"</strong>.</p>
        </div>
      )}

      <style>{`
        @media(max-width:600px){
          .dx-form{grid-template-columns:1fr!important}
          .dx-form .span2{grid-column:1!important}
        }
      `}</style>
    </div>
  );
}
