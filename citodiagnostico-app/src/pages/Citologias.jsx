import { useState, useEffect } from 'react';
import { Search, Edit, Phone, RefreshCw, List, Printer } from 'lucide-react';
import { Card, Btn, EstatusPill, PagoPill, Modal, Spinner } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

function hoy() { return new Date().toISOString().slice(0,10); }
function hace20() { const d=new Date();d.setDate(d.getDate()-20);return d.toISOString().slice(0,10); }

function diasDesde(fechaStr) {
  if (!fechaStr) return null;
  try {
    const p = fechaStr.split('/');
    if (p.length!==3) return null;
    return Math.floor((new Date()-new Date(p[2],p[1]-1,p[0]))/(1000*60*60*24));
  } catch { return null; }
}

const MUESTRAS = ['CERVICO VAGINAL','CUPULA VAGINAL','CITOLOGIA LIQUIDA','BIOPSIA'];
const PAGOS    = ['PAGADO','PENDIENTE','TRANSFERENCIA'];

export default function Citologias() {
  const { medicos, mostrarToast } = useApp();
  const [citos,    setCitos]    = useState([]);
  const [cargando, setCargando] = useState(false);
  const [desde,    setDesde]    = useState(hoy());
  const [hasta,    setHasta]    = useState(hoy());
  const [filtroNombre,  setFiltroNombre]  = useState('');
  const [filtroMedico,  setFiltroMedico]  = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [editModal,     setEditModal]     = useState(null);
  const [editForm,      setEditForm]      = useState({});
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [waModal,       setWaModal]       = useState(false);
  const [modoVista,     setModoVista]     = useState('fecha');
  // Impresión en lote
  const [imprimiendoLote, setImprimiendoLote] = useState(false);

  useEffect(() => { cargarFecha(); }, []);

  const cargarFecha = async () => {
    setCargando(true);
    setModoVista('fecha');
    try {
      const res = await api.getCitologiasPorFecha(desde, hasta, filtroMedico);
      setCitos(res || []);
      setSeleccionados([]);
    } catch(e) { mostrarToast('Error: '+e.message,'error'); }
    finally { setCargando(false); }
  };

  const cargarPendientes = async () => {
    setCargando(true);
    setModoVista('pendientes');
    try {
      const res = await api.getCitologiasPendientes();
      setCitos(res || []);
      setSeleccionados([]);
    } catch(e) { mostrarToast('Error: '+e.message,'error'); }
    finally { setCargando(false); }
  };

  const citosFiltradas = citos.filter(c => {
    if (filtroNombre && !c.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
    if (filtroEstatus && c.estatus!==filtroEstatus) return false;
    return true;
  });

  const abrirEditar = (cito) => { setEditForm({...cito}); setEditModal(cito); };

  const guardarEdicion = async () => {
    setGuardandoEdit(true);
    try {
      await api.actualizarCitologia({
        idCito:editForm.idCito, nombre:editForm.nombre, medico:editForm.medico,
        edad:editForm.edad, precio:editForm.precio, pagado:editForm.pagado,
        muestra:editForm.muestra, observaciones:editForm.observaciones
      });
      mostrarToast('Actualizado');
      setCitos(prev=>prev.map(c=>c.idCito===editForm.idCito?{...c,...editForm}:c));
      setEditModal(null);
    } catch(e) { mostrarToast('Error: '+e.message,'error'); }
    finally { setGuardandoEdit(false); }
  };

  const enviarWAIndividual = (cito) => {
    const med = medicos.find(m=>m.nombre===cito.medico);
    const num = med?.whatsapp?String(med.whatsapp).replace(/\D/g,''):'';
    if (!num) { mostrarToast('Este medico no tiene WhatsApp','error'); return; }
    const msg = 'Resultado citologia de '+cito.nombre+' ('+cito.idCito+'): '+cito.urlPDF;
    window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank');
    api.marcarEnviado(cito.idCito).catch(()=>{});
  };

  const toggleSeleccion = (idCito) => {
    setSeleccionados(prev=>prev.includes(idCito)?prev.filter(id=>id!==idCito):[...prev,idCito]);
  };

  const seleccionarTodas = () => {
    setSeleccionados(citosFiltradas.filter(c=>c.estatus==='REALIZADO'&&c.urlPDF).map(c=>c.idCito));
  };

  const enviarLoteWA = (numero) => {
    const selec = citosFiltradas.filter(c=>seleccionados.includes(c.idCito)&&c.urlPDF);
    if (!selec.length) { mostrarToast('Selecciona citologias con PDF','error'); return; }
    const links = selec.map(c=>'- '+c.nombre+' ('+c.idCito+'): '+c.urlPDF).join('\n');
    const msg = 'Estimado/a doctor/a, le compartimos los resultados:\n\n'+links;
    window.open('https://wa.me/'+numero.replace(/\D/g,'')+'?text='+encodeURIComponent(msg),'_blank');
    selec.forEach(c=>api.marcarEnviado(c.idCito).catch(()=>{}));
    setSeleccionados([]);
    setWaModal(false);
  };

  // IMPRESION EN LOTE — abre ventana con todos los reportes seleccionados
  const imprimirLote = async () => {
    const selec = citosFiltradas.filter(c=>seleccionados.includes(c.idCito)&&c.urlPDF);
    if (!selec.length) { mostrarToast('Selecciona citologias con PDF para imprimir','error'); return; }
    setImprimiendoLote(true);
    try {
      const v = window.open('','_blank','width=900,height=700');
      v.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Impresion en lote</title>'
        +'<style>body{font-family:Arial;font-size:12px;padding:10px}'
        +'@media print{.no-print{display:none}.pagina{page-break-after:always}}'
        +'.pagina{margin-bottom:20px;border:1px solid #ccc;padding:16px;max-width:680px;margin-left:auto;margin-right:auto}'
        +'.header{background:#802f58;color:white;padding:8px 16px;text-align:center;font-weight:bold;letter-spacing:0.08em}'
        +'.datos{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;border-bottom:1px solid #eee}'
        +'.label{font-size:9px;text-transform:uppercase;color:#888}.val{font-weight:bold}'
        +'</style></head><body>'
        +'<div class="no-print" style="text-align:center;padding:16px;background:#f5f5f5;margin-bottom:16px">'
        +'<button onclick="window.print()" style="padding:10px 24px;background:#802f58;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer">'
        +'Imprimir '+selec.length+' reportes</button></div>');

      selec.forEach((c,i) => {
        v.document.write('<div class="pagina">'
          +'<div class="header">REPORTE DE ESTUDIO CITOLOGICO</div>'
          +'<div class="datos">'
          +'<div><div class="label">Paciente</div><div class="val">'+c.nombre+'</div></div>'
          +'<div><div class="label"># Citologia</div><div class="val" style="color:#802f58;font-size:16px">'+c.idCito+'</div></div>'
          +'<div><div class="label">Medico refiere</div><div class="val">'+c.medico+'</div></div>'
          +'<div><div class="label">Muestra</div><div class="val">'+c.muestra+'</div></div>'
          +'<div><div class="label">Fecha recepcion</div><div class="val">'+c.fecha+'</div></div>'
          +'<div><div class="label">PDF completo</div><div class="val"><a href="'+c.urlPDF+'" target="_blank">Ver reporte completo</a></div></div>'
          +'</div>'
          +'<div style="text-align:center;padding:12px;font-size:11px;color:#666">Para el reporte completo con diagnostico, abrir el link del PDF</div>'
          +'</div>');
      });

      v.document.write('</body></html>');
      v.document.close();
      mostrarToast(selec.length+' reportes listos para imprimir');
    } catch(e) { mostrarToast('Error: '+e.message,'error'); }
    finally { setImprimiendoLote(false); }
  };

  const colorMuestra = (m) => {
    if (m==='CITOLOGIA LIQUIDA') return { bg:'#dbeafe', color:'#1e40af' };
    if (m==='BIOPSIA') return { bg:'#fef3c7', color:'#92400e' };
    return { bg:'var(--rosa-pale)', color:'var(--rosa)' };
  };

  return (
    <div className="fade-in">
      <Card>
        <div style={{ padding:'14px 20px' }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end', marginBottom:12 }}>
            <div className="form-group">
              <label className="form-label">Desde</label>
              <input type="date" className="form-input" value={desde} onChange={e=>setDesde(e.target.value)} style={{ width:150 }}/>
            </div>
            <div className="form-group">
              <label className="form-label">Hasta</label>
              <input type="date" className="form-input" value={hasta} onChange={e=>setHasta(e.target.value)} style={{ width:150 }}/>
            </div>
            <div className="form-group" style={{ flex:1, minWidth:180 }}>
              <label className="form-label">Medico</label>
              <input className="form-input" placeholder="Filtrar por medico..." value={filtroMedico} onChange={e=>setFiltroMedico(e.target.value)}/>
            </div>
            <Btn variant="primary" onClick={cargarFecha} disabled={cargando}>Buscar por fecha</Btn>
            <Btn onClick={cargarPendientes} disabled={cargando}>Ver pendientes</Btn>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div className="search-wrap" style={{ flex:1, minWidth:160 }}>
              <Search className="search-icon" size={14}/>
              <input className="form-input" placeholder="Buscar por nombre..." value={filtroNombre} onChange={e=>setFiltroNombre(e.target.value)}/>
            </div>
            <select className="form-select" value={filtroEstatus} onChange={e=>setFiltroEstatus(e.target.value)} style={{ width:150 }}>
              <option value="">Todos</option>
              <option value="EN PROCESO">En proceso</option>
              <option value="REALIZADO">Realizados</option>
            </select>
            {seleccionados.length>0 && (<>
              <button onClick={()=>setWaModal(true)}
                style={{ padding:'8px 14px', borderRadius:7, fontSize:12, fontWeight:600, background:'#25d366', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Phone size={14}/> WhatsApp ({seleccionados.length})
              </button>
              <button onClick={imprimirLote} disabled={imprimiendoLote}
                style={{ padding:'8px 14px', borderRadius:7, fontSize:12, fontWeight:600, background:'#1e40af', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Printer size={14}/> Imprimir ({seleccionados.length})
              </button>
            </>)}
          </div>
        </div>
      </Card>

      {/* Resumen */}
      {citosFiltradas.length>0 && (
        <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
          {[
            { label:'Total', val:citosFiltradas.length, color:'var(--rosa)' },
            { label:'En proceso', val:citosFiltradas.filter(c=>c.estatus==='EN PROCESO').length, color:'#856404' },
            { label:'Realizadas', val:citosFiltradas.filter(c=>c.estatus==='REALIZADO').length, color:'#065f46' },
            { label:'Con PDF', val:citosFiltradas.filter(c=>c.urlPDF).length, color:'#1e40af' },
          ].map((m,i)=>(
            <div key={i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'10px 16px', textAlign:'center', minWidth:90 }}>
              <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:22, fontWeight:700, color:m.color }}>{m.val}</div>
            </div>
          ))}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'10px 16px', textAlign:'center', minWidth:100 }}>
            <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Total $</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#0a6640' }}>
              ${citosFiltradas.reduce((s,c)=>s+(parseFloat(c.precio)||0),0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <Card title={modoVista==='pendientes'?'Pendientes':'Citologias del periodo'} icon={List}
        action={
          <div className="btn-group">
            {citosFiltradas.filter(c=>c.estatus==='REALIZADO'&&c.urlPDF).length>0&&(
              <Btn size="sm" onClick={seleccionarTodas}>Seleccionar realizadas</Btn>
            )}
            {seleccionados.length>0&&<Btn size="sm" onClick={()=>setSeleccionados([])}>Deseleccionar</Btn>}
          </div>
        }>
        {cargando
          ? <div style={{ padding:40, textAlign:'center' }}><Spinner/></div>
          : citosFiltradas.length===0
            ? <div style={{ padding:32, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>Sin registros</div>
            : <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width:32 }}></th>
                      <th># Cito</th><th>Paciente</th><th>Edad</th><th>Medico</th>
                      <th>Muestra</th><th>Fecha</th><th>Dias</th><th>Pago</th><th>Estatus</th><th>PDF</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citosFiltradas.map((c,i)=>{
                      const dias = diasDesde(c.fecha);
                      const cm = colorMuestra(c.muestra);
                      const urgente = c.estatus==='EN PROCESO' && dias!==null && dias>=2;
                      return (
                        <tr key={i} style={{
                          background: seleccionados.includes(c.idCito)?'var(--rosa-paler)':urgente?'#fffbeb':''
                        }}>
                          <td>
                            {c.estatus==='REALIZADO'&&c.urlPDF&&(
                              <input type="checkbox" checked={seleccionados.includes(c.idCito)}
                                onChange={()=>toggleSeleccion(c.idCito)}
                                style={{ accentColor:'var(--rosa)', width:15, height:15, cursor:'pointer' }}/>
                            )}
                          </td>
                          <td><strong style={{ color:'var(--rosa)' }}>{c.idCito}</strong></td>
                          <td style={{ fontWeight:500, minWidth:140 }}>{c.nombre}</td>
                          <td>{c.edad}</td>
                          <td style={{ fontSize:11, minWidth:120 }}>{c.medico}</td>
                          <td>
                            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:12, fontWeight:600, background:cm.bg, color:cm.color, whiteSpace:'nowrap' }}>
                              {c.muestra==='CITOLOGIA LIQUIDA'?'LIQUIDA':c.muestra==='CUPULA VAGINAL'?'CUPULA':c.muestra}
                            </span>
                          </td>
                          <td style={{ fontSize:11, whiteSpace:'nowrap' }}>{c.fecha}</td>
                          <td style={{ textAlign:'center' }}>
                            {dias!==null && (
                              <span style={{ fontSize:11, padding:'2px 7px', borderRadius:12, fontWeight:600,
                                background: c.estatus==='REALIZADO'?'#f0fdf4':dias>=3?'#fef2f2':dias>=2?'#fef3c7':'#f0fdf4',
                                color: c.estatus==='REALIZADO'?'#065f46':dias>=3?'#991b1b':dias>=2?'#92400e':'#065f46' }}>
                                {dias===0?'Hoy':dias===1?'1d':dias+'d'}
                              </span>
                            )}
                          </td>
                          <td><PagoPill pago={c.pagado}/></td>
                          <td><EstatusPill estatus={c.estatus}/></td>
                          <td>
                            {c.urlPDF
                              ? <a href={c.urlPDF} target="_blank" rel="noreferrer" style={{ color:'var(--rosa)', fontSize:11, fontWeight:600, textDecoration:'none' }}>Ver</a>
                              : <span style={{ color:'var(--text-3)', fontSize:11 }}>—</span>
                            }
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:4 }}>
                              <button onClick={()=>abrirEditar(c)} title="Editar"
                                style={{ padding:'5px 7px', borderRadius:6, border:'1px solid var(--border)', background:'#fff', cursor:'pointer', fontSize:13 }}>
                                ✏️
                              </button>
                              {c.urlPDF&&(
                                <button onClick={()=>enviarWAIndividual(c)} title="WhatsApp"
                                  style={{ padding:'5px 7px', borderRadius:6, border:'none', background:'#25d366', cursor:'pointer', fontSize:13 }}>
                                  📱
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        }
      </Card>

      {/* Modal edicion */}
      <Modal open={!!editModal} onClose={()=>setEditModal(null)} title={'Editar — '+editModal?.idCito}
        footer={
          <div className="btn-group">
            <Btn onClick={()=>setEditModal(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={guardarEdicion} disabled={guardandoEdit}>
              {guardandoEdit?'Guardando...':'Guardar'}
            </Btn>
          </div>
        }>
        {editModal&&(
          <div className="form-grid">
            <div className="form-group span2">
              <label className="form-label">Nombre</label>
              <input className="form-input" value={editForm.nombre||''} style={{ textTransform:'uppercase' }}
                onChange={e=>setEditForm(f=>({...f,nombre:e.target.value.toUpperCase()}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Edad</label>
              <input type="number" className="form-input" value={editForm.edad||''}
                onChange={e=>setEditForm(f=>({...f,edad:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Precio ($)</label>
              <input type="number" className="form-input" value={editForm.precio||''} step="0.5"
                onChange={e=>setEditForm(f=>({...f,precio:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Muestra</label>
              <select className="form-select" value={editForm.muestra||''} onChange={e=>setEditForm(f=>({...f,muestra:e.target.value}))}>
                {MUESTRAS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pago</label>
              <select className="form-select" value={editForm.pagado||''} onChange={e=>setEditForm(f=>({...f,pagado:e.target.value}))}>
                {PAGOS.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group span2">
              <label className="form-label">Medico</label>
              <input className="form-input" value={editForm.medico||''}
                onChange={e=>setEditForm(f=>({...f,medico:e.target.value.toUpperCase()}))}/>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal WA lote */}
      <Modal open={waModal} onClose={()=>setWaModal(false)} title={'Enviar '+seleccionados.length+' resultado(s) por WhatsApp'} size="sm"
        footer={<Btn onClick={()=>setWaModal(false)}>Cancelar</Btn>}>
        <div>
          <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:14 }}>Selecciona el medico al que enviar:</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:300, overflowY:'auto' }}>
            {medicos.filter(m=>m.whatsapp&&m.activo==='SI').map((m,i)=>(
              <button key={i} onClick={()=>enviarLoteWA(String(m.whatsapp))}
                style={{ padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:'#fff', cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--rosa-paler)'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <span style={{ fontSize:13, fontWeight:500 }}>{m.nombre}</span>
                <span style={{ fontSize:11, color:'#25d366', fontWeight:600 }}>{m.whatsapp}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
