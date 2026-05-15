import { useState, useEffect } from 'react';
import { Search, Eye, Save, ChevronDown, ChevronUp } from 'lucide-react';
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

function CampoDx({ label, name, value, onChange, opciones=[], textarea=false, highlight }) {
  const [abierto, setAbierto] = useState(false);
  const seleccionar = (o) => { onChange({ target:{ name, value:o } }); setAbierto(false); };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', color:highlight?'var(--rosa)':'var(--text-3)', fontWeight:600, marginBottom:6 }}>
        {label}
      </label>
      <div style={{ position:'relative' }}>
        {textarea
          ? <textarea className="form-textarea" name={name} value={value} onChange={onChange} rows={2}/>
          : <div style={{ display:'flex', gap:6 }}>
              <input className="form-input" name={name} value={value} onChange={onChange}
                style={{ flex:1, borderColor:highlight?'var(--rosa-light)':'' }}/>
              {opciones.length>0 && (
                <button type="button" onClick={()=>setAbierto(!abierto)}
                  style={{ padding:'0 10px', border:'1px solid var(--border)', borderRadius:7, background:'var(--rosa-pale)', color:'var(--rosa)', cursor:'pointer', flexShrink:0 }}>
                  {abierto?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                </button>
              )}
            </div>
        }
        {abierto && opciones.length>0 && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1px solid var(--border)', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', maxHeight:240, overflowY:'auto' }}>
            {opciones.map((o,i)=>(
              <div key={i} onMouseDown={()=>seleccionar(o)}
                style={{ padding:'10px 14px', cursor:'pointer', fontSize:12, borderBottom:'1px solid #fdf4f8', color:'var(--text-2)', lineHeight:1.5 }}
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

function diasDesde(fechaStr) {
  if (!fechaStr) return null;
  try {
    const partes = fechaStr.split('/');
    if (partes.length !== 3) return null;
    const fecha = new Date(partes[2], partes[1]-1, partes[0]);
    const diff = Math.floor((new Date() - fecha) / (1000*60*60*24));
    return diff;
  } catch { return null; }
}

export default function Diagnostico() {
  const { diagnosticos, medicos, mostrarToast } = useApp();
  const [busqueda,  setBusqueda]  = useState('');
  const [modoBusqueda, setModoBusqueda] = useState('id'); // 'id' | 'nombre'
  const [resultadosNombre, setResultadosNombre] = useState([]);
  const [buscandoNombre, setBuscandoNombre] = useState(false);
  const [cito,      setCito]      = useState(null);
  const [dx,        setDx]        = useState(dxVacio());
  const [tab,       setTab]       = useState('form');
  const [cargandoBuscar, setCargandoBuscar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [pdfData,   setPdfData]   = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [cargandoPend, setCargandoPend] = useState(true);
  const [waNumeroEdit, setWaNumeroEdit] = useState('');
  const [editandoWa,   setEditandoWa]   = useState(false);

  const d = diagnosticos || {};

  useEffect(() => { cargarPendientes(); }, []);

  const cargarPendientes = async () => {
    setCargandoPend(true);
    try {
      const res = await api.getCitologiasPendientes();
      setPendientes(res || []);
    } catch(e) { console.error(e); }
    finally { setCargandoPend(false); }
  };

  // Búsqueda por nombre con debounce
  useEffect(() => {
    if (modoBusqueda !== 'nombre' || busqueda.trim().length < 3) {
      setResultadosNombre([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoNombre(true);
      try {
        const res = await api.buscarPorNombre(busqueda.trim());
        setResultadosNombre(res || []);
      } catch(e) { console.error(e); }
      finally { setBuscandoNombre(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda, modoBusqueda]);

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
    setResultadosNombre([]);
    try {
      const res = await api.buscarCitologia(idBuscar);
      if (!res) { mostrarToast('No encontrada: ' + idBuscar, 'error'); return; }
      setCito(res);
      setBusqueda(res.idCito);
      setModoBusqueda('id');
      setDx(res.diagnostico ? { ...dxVacio(), ...res.diagnostico } : dxVacio());
      setPdfData(null);
      setTab('form');
      const med = medicos.find(m => m.nombre === res.medico);
      setWaNumeroEdit(med?.whatsapp ? String(med.whatsapp) : '');
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setCargandoBuscar(false);
    }
  };

  const guardar = async () => {
    if (!cito) { mostrarToast('Carga una citologia primero', 'error'); return; }
    setGuardando(true);
    try {
      await api.guardarDiagnostico({
        idCito:cito.idCito, nombre:cito.nombre, medico:cito.medico,
        edad:cito.edad, fechaRecepcion:cito.fecha,
        tipoMuestra:dx.tipoMuestra, muestraRecibida:cito.muestra, ...dx
      });
      mostrarToast('Diagnostico guardado');
      setCito(c => ({ ...c, estatus:'REALIZADO' }));
      cargarPendientes();
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
    if (!numero) { mostrarToast('Agrega el numero de WhatsApp', 'error'); return; }
    const msg = 'Resultado citologia de ' + cito?.nombre + ' (' + cito?.idCito + '): ' + pdfData.urlPDF;
    window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(msg), '_blank');
    api.marcarEnviado(cito.idCito).catch(()=>{});
  };

  const marcarBiopsiaEnviada = async () => {
    if (!cito) return;
    try {
      await api.actualizarCitologia({ idCito:cito.idCito, estatus:'REALIZADO', pagado:cito.pagado });
      mostrarToast('Biopsia marcada como enviada');
      setCito(c => ({ ...c, estatus:'REALIZADO' }));
      cargarPendientes();
    } catch(e) { mostrarToast('Error: ' + e.message, 'error'); }
  };

  const esBiopsia = cito?.muestra === 'BIOPSIA';
  const esLiquida = cito?.muestra === 'CITOLOGIA LIQUIDA';

  return (
    <div className="fade-in">
      <div style={{ display:'grid', gridTemplateColumns:cito?'1fr':'1fr 300px', gap:16, marginBottom:16 }}>

        {/* Columna principal */}
        <div>
          <Card style={{ marginBottom:16 }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
              {/* Toggle modo búsqueda */}
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                {[['id','# Citologia'],['nombre','Nombre paciente']].map(([modo,label])=>(
                  <button key={modo} onClick={()=>{setModoBusqueda(modo);setBusqueda('');setResultadosNombre([]);}}
                    style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid',
                      borderColor:modoBusqueda===modo?'var(--rosa)':'var(--border)',
                      background:modoBusqueda===modo?'var(--rosa-pale)':'#fff',
                      color:modoBusqueda===modo?'var(--rosa)':'var(--text-3)' }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', position:'relative', zIndex:200 }}>
                <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
                  <Search className="search-icon" size={16}/>
                  <input className="form-input"
                    placeholder={modoBusqueda==='id'?'# citologia (ej: 3043-26)...':'Nombre de la paciente...'}
                    value={busqueda}
                    onChange={e=>setBusqueda(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&modoBusqueda==='id'&&buscar()}/>
                </div>
                {modoBusqueda==='id' && (
                  <Btn variant="primary" onClick={()=>buscar()} disabled={cargandoBuscar}>
                    {cargandoBuscar?<Spinner/>:'Cargar'}
                  </Btn>
                )}
                {modoBusqueda==='nombre' && buscandoNombre && <Spinner/>}
                <Btn onClick={cargarPendientes} disabled={cargandoPend}>Actualizar</Btn>

                {/* Resultados búsqueda por nombre */}
                {modoBusqueda==='nombre' && resultadosNombre.length>0 && (
                  <div style={{ position:'fixed', top:'auto', left:'50%', transform:'translateX(-50%)',
                    width:'min(680px, 90vw)', zIndex:9999,
                    background:'#fff', border:'1px solid var(--border)', borderRadius:8,
                    boxShadow:'0 8px 32px rgba(0,0,0,0.18)', maxHeight:300, overflowY:'auto', marginTop:4 }}>
                    {resultadosNombre.map((r,i)=>(
                      <div key={i} onClick={()=>buscar(r.idCito)}
                        style={{ padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #fdf4f8',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--rosa-paler)'}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{r.nombre}</div>
                          <div style={{ fontSize:11, color:'var(--text-3)' }}>{r.medico} · {r.fecha}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:700, color:'var(--rosa)', fontSize:13 }}>{r.idCito}</div>
                          <EstatusPill estatus={r.estatus}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {modoBusqueda==='nombre' && busqueda.length>0 && busqueda.length<3 && (
                  <div style={{ position:'absolute', top:'100%', left:0, fontSize:11, color:'var(--text-3)', padding:'8px 16px', background:'#fff', border:'1px solid var(--border)', borderRadius:8, marginTop:4, zIndex:9999 }}>
                    Escribe al menos 3 letras...
                  </div>
                )}
              </div>
            </div>

            {/* Info del paciente */}
            {cito && (
              <div style={{ padding:'14px 20px', background:esLiquida?'#eff6ff':esBiopsia?'#fef3c7':'var(--rosa-paler)', borderBottom:'1px solid var(--border)' }}>
                {(esLiquida||esBiopsia) && (
                  <div style={{ display:'inline-block', marginBottom:10, padding:'3px 12px', borderRadius:20,
                    background:esLiquida?'#1e40af':'#92400e', color:'#fff', fontSize:11, fontWeight:700 }}>
                    {esLiquida?'CITOLOGIA LIQUIDA':'BIOPSIA - Se envia a laboratorio externo'}
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                  <div><div className="info-label"># Citologia</div><div className="info-val" style={{ color:'var(--rosa)', fontSize:18, fontWeight:700 }}>{cito.idCito}</div></div>
                  <div><div className="info-label">Paciente</div><div className="info-val">{cito.nombre}</div></div>
                  <div><div className="info-label">Edad</div><div className="info-val">{cito.edad} anos</div></div>
                  <div><div className="info-label">Estatus</div><div className="info-val"><EstatusPill estatus={cito.estatus}/></div></div>
                  <div><div className="info-label">Medico referidor</div><div className="info-val" style={{ fontWeight:600 }}>{cito.medico}</div></div>
                  <div><div className="info-label">Tipo de muestra</div><div className="info-val">{cito.muestra}</div></div>
                  <div><div className="info-label">Fecha recepcion</div><div className="info-val">{cito.fecha}</div></div>
                  <div><div className="info-label">Pago</div><div className="info-val">{cito.pagado}</div></div>
                </div>
              </div>
            )}
          </Card>

          {/* Biopsia */}
          {cito && esBiopsia && (
            <Card>
              <div style={{ padding:24, textAlign:'center' }}>
                <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:20 }}>
                  Las biopsias se envian a laboratorio externo. No se genera reporte aqui.
                </p>
                {cito.estatus!=='REALIZADO'
                  ? <Btn variant="primary" onClick={marcarBiopsiaEnviada}>Marcar como enviada</Btn>
                  : <div style={{ color:'#0a6640', fontWeight:600 }}>Ya marcada como enviada</div>
                }
              </div>
            </Card>
          )}

          {/* Formulario */}
          {cito && !esBiopsia && (
            <Card>
              <div className="tabs">
                <button className={`tab-btn ${tab==='form'?'active':''}`} onClick={()=>setTab('form')}>
                  <Search size={14}/> Llenar diagnostico
                </button>
                <button className={`tab-btn ${tab==='preview'?'active':''}`} onClick={()=>setTab('preview')}>
                  <Eye size={14}/> Vista previa
                </button>
              </div>

              {tab==='form' && (
                <div style={{ padding:'24px 28px' }}>
                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-3)', fontWeight:600, marginBottom:6 }}>Tipo de muestra (para el reporte)</label>
                    <select className="form-select" name="tipoMuestra" value={dx.tipoMuestra} onChange={handleDx}>
                      {TIPOS_MUESTRA.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div style={{ borderBottom:'1px solid var(--border)', marginBottom:20, paddingBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--rosa)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Calidad e interpretacion</span>
                  </div>
                  {/* Calidad e interpretacion - ancho completo */}
                  <CampoDx label="Calidad de la muestra" name="calidad" value={dx.calidad} onChange={handleDx} opciones={d.calidadMuestra||[]}/>
                  <CampoDx label="Interpretacion / Resultado" name="interpretacion" value={dx.interpretacion} onChange={handleDx} opciones={d.interpretacion||[]} highlight/>

                  {(dx.interpretacion==='ANOMALIAS EPITELIALES ESCAMOSAS'||
                    dx.interpretacion==='ANOMALIAS EPITELIALES GLANDULARES'||
                    dx.interpretacion==='NEOPLASIA INTRAEPITELIAL VAGINAL (VAIN)')&&(<>
                    <div style={{ borderBottom:'1px solid var(--border)', marginBottom:20, paddingBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--rosa)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Anomalias epiteliales</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      <CampoDx label="Tipo de anomalia" name="anomaliaTipo" value={dx.anomaliaTipo} onChange={handleDx} opciones={[...new Set(d.anomaliaTipo||[])]}/>
                      <CampoDx label="Detalle de la anomalia" name="anomaliaDetalle" value={dx.anomaliaDetalle} onChange={handleDx} opciones={d.anomaliaDetalle||[]}/>
                    </div>
                    <CampoDx label="Celulas escamosas atipicas (ASC)" name="ascAtipicas" value={dx.ascAtipicas} onChange={handleDx} opciones={d.ascAtipicas||[]}/>
                  </>)}

                  <div style={{ borderBottom:'1px solid var(--border)', marginBottom:20, paddingBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--rosa)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Hallazgos no neoplasicos</span>
                  </div>
                  {/* Hallazgos en 2 columnas */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <CampoDx label="Variaciones celulares" name="variaciones" value={dx.variaciones} onChange={handleDx} opciones={d.variaciones||[]}/>
                    <CampoDx label="Cambios celulares reactivos" name="cambiosReactivos" value={dx.cambiosReactivos} onChange={handleDx} opciones={d.cambiosReactivos||[]}/>
                    <CampoDx label="Flora bacteriana" name="flora" value={dx.flora} onChange={handleDx} opciones={(d.flora||[]).map(o=>o==='NINGUNA'?'AUSENTES':o)}/>
                    <CampoDx label="Microorganismos" name="microorganismos" value={dx.microorganismos} onChange={handleDx} opciones={(d.microorganismos||[]).map(o=>o==='NINGUNO'?'AUSENTES':o)}/>
                  </div>

                  <div style={{ borderBottom:'1px solid var(--border)', marginBottom:20, paddingBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--rosa)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Diagnostico final</span>
                  </div>
                  <div style={{ background:'var(--rosa-pale)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 16px', fontSize:12, color:'var(--rosa)', lineHeight:1.7, marginBottom:20 }}>
                    <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, fontWeight:700 }}>Preview auto-generado:</div>
                    {dx.dx1&&<div>{dx.dx1}</div>}{dx.dx2&&<div>{dx.dx2}</div>}{dx.dx3&&<div>{dx.dx3}</div>}{dx.dx4&&<div>{dx.dx4}</div>}
                  </div>
                  {/* Lineas de diagnostico en 2 columnas */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {[1,2,3,4].map(n=>(
                      <div key={n} style={{ marginBottom:8 }}>
                        <label style={{ display:'block', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-3)', fontWeight:600, marginBottom:6 }}>
                          Diagnostico linea {n} {n===1?'(principal)':n>2?'(opcional)':''}
                        </label>
                        <textarea className="form-textarea" name={'dx'+n} value={dx['dx'+n]}
                          onChange={handleDxDirecto} rows={3} style={{ borderColor:n===1?'var(--rosa-light)':'', resize:'vertical' }}/>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderBottom:'1px solid var(--border)', marginBottom:20, paddingBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--rosa)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Observaciones y comentarios</span>
                  </div>
                  <CampoDx label="Observaciones" textarea name="observaciones" value={dx.observaciones} onChange={handleDx} opciones={['SIN OBSERVACIONES']}/>
                  <CampoDx label="Comentarios y sugerencias" name="comentarios" value={dx.comentarios} onChange={handleDx} opciones={d.comentarios||[]}/>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-3)', fontWeight:600, marginBottom:6 }}>Comentarios libres adicionales</label>
                    <textarea className="form-textarea" name="comentariosLibres" value={dx.comentariosLibres} onChange={handleDxDirecto} rows={2}/>
                  </div>

                  <div className="form-actions" style={{ paddingTop:8 }}>
                    <Btn onClick={()=>setTab('preview')} icon={Eye}>Vista previa</Btn>
                    <Btn variant="primary" icon={Save} onClick={guardar} disabled={guardando}>
                      {guardando?'Guardando...':'Guardar diagnostico'}
                    </Btn>
                  </div>
                </div>
              )}

              {tab==='preview' && (
                <div style={{ padding:20, background:'var(--bg)' }}>
                  <ReportePreview cito={cito} dx={dx} onGuardarDrive={generarPDF}/>
                  {pdfData && (
                    <div style={{ marginTop:16, padding:16, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#065f46', marginBottom:12 }}>PDF listo — {pdfData.nombreArchivo}</div>
                      <div style={{ marginBottom:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontSize:12, color:'var(--text-3)' }}>WhatsApp:</span>
                        {editandoWa
                          ? <><input value={waNumeroEdit} onChange={e=>setWaNumeroEdit(e.target.value)}
                              style={{ padding:'6px 10px', border:'1px solid var(--border)', borderRadius:7, fontSize:13, width:180 }}/>
                            <Btn size="sm" onClick={()=>setEditandoWa(false)}>OK</Btn></>
                          : <><span style={{ fontSize:13, fontWeight:600 }}>{waNumeroEdit||'Sin numero'}</span>
                            <Btn size="sm" onClick={()=>setEditandoWa(true)}>Editar</Btn></>
                        }
                      </div>
                      <div className="btn-group" style={{ flexWrap:'wrap' }}>
                        {pdfData.urlPDF&&<a href={pdfData.urlPDF} target="_blank" rel="noreferrer" className="btn btn-sm">Ver PDF</a>}
                        <button onClick={abrirWhatsApp}
                          style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#25d366', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          Enviar por WhatsApp
                        </button>
                      </div>
                    </div>
                  )}
                  {!pdfData && (
                    <div className="form-actions" style={{ justifyContent:'center', marginTop:16 }}>
                      <Btn icon={Save} onClick={guardar} disabled={guardando}>{guardando?'Guardando...':'Guardar'}</Btn>
                      <Btn variant="primary" onClick={generarPDF} disabled={generandoPDF}>{generandoPDF?'Generando...':'Guardar en Drive + REALIZADO'}</Btn>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {!cito && (
            <div style={{ textAlign:'center', padding:32, color:'var(--text-3)' }}>
              <p style={{ fontSize:13 }}>Busca por # citologia o nombre, o selecciona un pendiente.</p>
            </div>
          )}
        </div>

        {/* Panel pendientes */}
        {!cito && (
          <div>
            <Card title="Pendientes de diagnostico">
              {cargandoPend
                ? <div style={{ padding:24, textAlign:'center' }}><Spinner/></div>
                : pendientes.length===0
                  ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13, textAlign:'center' }}>Sin pendientes</div>
                  : <div style={{ maxHeight:600, overflowY:'auto' }}>
                      {pendientes.map((p,i)=>{
                        const dias = diasDesde(p.fecha);
                        const urgente = dias !== null && dias >= 2;
                        return (
                          <div key={i} onClick={()=>buscar(p.idCito)}
                            style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer',
                              background: urgente?'#fffbeb':'#fff', transition:'background .15s' }}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--rosa-paler)'}
                            onMouseLeave={e=>e.currentTarget.style.background=urgente?'#fffbeb':'#fff'}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                              <span style={{ fontWeight:700, color:'var(--rosa)', fontSize:13 }}>{p.idCito}</span>
                              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                {dias !== null && (
                                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:12, fontWeight:700,
                                    background: dias>=3?'#fef2f2':dias>=2?'#fef3c7':'#f0fdf4',
                                    color: dias>=3?'#991b1b':dias>=2?'#92400e':'#065f46' }}>
                                    {dias===0?'Hoy':dias===1?'1 dia':dias+' dias'}
                                  </span>
                                )}
                                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, fontWeight:600,
                                  background:p.muestra==='CITOLOGIA LIQUIDA'?'#dbeafe':'var(--rosa-pale)',
                                  color:p.muestra==='CITOLOGIA LIQUIDA'?'#1e40af':'var(--rosa)' }}>
                                  {p.muestra==='CITOLOGIA LIQUIDA'?'LIQUIDA':p.muestra==='BIOPSIA'?'BIOPSIA':'CONV'}
                                </span>
                              </div>
                            </div>
                            <div style={{ fontSize:12, fontWeight:500, color:'var(--text-2)', marginBottom:2 }}>{p.nombre}</div>
                            <div style={{ fontSize:11, color:'var(--text-3)' }}>{p.medico}</div>
                          </div>
                        );
                      })}
                    </div>
              }
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
