import { useState, useEffect, useRef } from 'react';
import { Search, Edit, Phone, Printer, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, Btn, EstatusPill, PagoPill, Modal, Spinner } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

function hoy() { return new Date().toISOString().slice(0,10); }
function hace20() {
  const d = new Date(); d.setDate(d.getDate()-20);
  return d.toISOString().slice(0,10);
}

export default function Citologias() {
  const { medicos, mostrarToast } = useApp();
  const [citos,     setCitos]     = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroFecha,  setFiltroFecha]  = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [desde, setDesde] = useState(hace20());
  const [hasta, setHasta] = useState(hoy());
  const [editModal, setEditModal]   = useState(null);
  const [editForm,  setEditForm]    = useState({});
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  // WhatsApp lote
  const [seleccionados, setSeleccionados] = useState([]);
  const [waModal, setWaModal] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      // Cargamos pendientes + realizadas del día/período
      // Usamos getCitologiasHoy como base y complementamos con pendientes
      const [hoyData, pendData] = await Promise.all([
        api.getCitologiasHoy(),
        api.getCitologiasPendientes()
      ]);
      // Combinar y deduplicar
      const mapa = {};
      [...pendData, ...hoyData].forEach(c => { mapa[c.idCito] = c; });
      setCitos(Object.values(mapa).sort((a,b) => {
        // Más recientes primero por idCito numérico
        const numA = parseInt((a.idCito||'').split('-')[0]) || 0;
        const numB = parseInt((b.idCito||'').split('-')[0]) || 0;
        return numB - numA;
      }));
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const buscarPorFecha = async () => {
    // Buscar usando las citologías pendientes + las realizadas hoy
    // En producción esto podría filtrarse más en el backend
    cargar();
  };

  // ── Filtros locales ──────────────────────────────────────
  const citosFiltradas = citos.filter(c => {
    if (filtroNombre && !c.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
    if (filtroMedico && !c.medico?.toLowerCase().includes(filtroMedico.toLowerCase())) return false;
    if (filtroEstatus && c.estatus !== filtroEstatus) return false;
    return true;
  });

  // ── Edición rápida ───────────────────────────────────────
  const abrirEditar = (cito) => {
    setEditForm({ ...cito });
    setEditModal(cito);
  };

  const guardarEdicion = async () => {
    setGuardandoEdit(true);
    try {
      await api.actualizarCitologia({
        idCito:  editForm.idCito,
        nombre:  editForm.nombre,
        medico:  editForm.medico,
        edad:    editForm.edad,
        precio:  editForm.precio,
        pagado:  editForm.pagado,
        muestra: editForm.muestra,
        observaciones: editForm.observaciones
      });
      mostrarToast('Citología actualizada');
      setCitos(prev => prev.map(c => c.idCito===editForm.idCito ? {...c,...editForm} : c));
      setEditModal(null);
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setGuardandoEdit(false);
    }
  };

  const actualizarPago = async (idCito, nuevoPago) => {
    try {
      await api.actualizarPago(idCito, nuevoPago);
      mostrarToast('Pago actualizado');
      setCitos(prev => prev.map(c => c.idCito===idCito ? {...c, pagado:nuevoPago} : c));
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    }
  };

  // ── WhatsApp lote ────────────────────────────────────────
  const toggleSeleccion = (idCito) => {
    setSeleccionados(prev =>
      prev.includes(idCito) ? prev.filter(id=>id!==idCito) : [...prev, idCito]
    );
  };

  const seleccionarTodas = () => {
    const realizadas = citosFiltradas.filter(c => c.estatus==='REALIZADO' && c.urlPDF);
    setSeleccionados(realizadas.map(c=>c.idCito));
  };

  const enviarLoteWA = (numero) => {
    const selec = citosFiltradas.filter(c => seleccionados.includes(c.idCito) && c.urlPDF);
    if (!selec.length) { mostrarToast('Seleccioná citologías con PDF', 'error'); return; }
    const links = selec.map(c => `• ${c.nombre} (${c.idCito}): ${c.urlPDF}`).join('\n');
    const msg = `Estimado/a doctor/a, le compartimos los resultados de citologías:\n\n${links}`;
    const num = numero.replace(/\D/g,'');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    // Marcar como enviadas
    selec.forEach(c => api.marcarEnviado(c.idCito).catch(()=>{}));
    setSeleccionados([]);
    setWaModal(false);
  };

  const MUESTRAS = ['CERVICO VAGINAL','CUPULA VAGINAL','CITOLOGIA LIQUIDA','BIOPSIA'];
  const PAGOS    = ['PAGADO','PENDIENTE','TRANSFERENCIA'];

  return (
    <div className="fade-in">
      {/* ── FILTROS ── */}
      <Card>
        <div style={{ padding:'14px 20px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div className="form-group" style={{ minWidth:180 }}>
            <label className="form-label">Buscar paciente</label>
            <div className="search-wrap">
              <Search className="search-icon" size={14}/>
              <input className="form-input" placeholder="Nombre..."
                value={filtroNombre} onChange={e=>setFiltroNombre(e.target.value)}/>
            </div>
          </div>
          <div className="form-group" style={{ minWidth:180 }}>
            <label className="form-label">Médico</label>
            <input className="form-input" placeholder="Filtrar por médico..."
              value={filtroMedico} onChange={e=>setFiltroMedico(e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Estatus</label>
            <select className="form-select" value={filtroEstatus} onChange={e=>setFiltroEstatus(e.target.value)} style={{ width:140 }}>
              <option value="">Todos</option>
              <option value="EN PROCESO">En proceso</option>
              <option value="REALIZADO">Realizados</option>
            </select>
          </div>
          <Btn icon={RefreshCw} onClick={cargar} disabled={cargando}>
            {cargando?<Spinner/>:'Actualizar'}
          </Btn>
          {seleccionados.length > 0 && (
            <button onClick={()=>setWaModal(true)}
              style={{ padding:'8px 14px', borderRadius:7, fontSize:12, fontWeight:600, background:'#25d366', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Phone size={14}/> Enviar {seleccionados.length} por WhatsApp
            </button>
          )}
        </div>
      </Card>

      {/* ── TABLA ── */}
      <Card title={`Citologías — ${citosFiltradas.length} registros`} icon={Search}
        action={
          <div className="btn-group">
            <Btn size="sm" onClick={seleccionarTodas}>Seleccionar realizadas</Btn>
            {seleccionados.length>0 && <Btn size="sm" onClick={()=>setSeleccionados([])}>Deseleccionar</Btn>}
          </div>
        }
      >
        {cargando
          ? <div style={{ padding:40, textAlign:'center' }}><Spinner/></div>
          : citosFiltradas.length === 0
            ? <div style={{ padding:24, textAlign:'center', color:'var(--text-3)' }}>No hay citologías para mostrar</div>
            : <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width:32 }}></th>
                      <th># Cito</th>
                      <th>Paciente</th>
                      <th>Edad</th>
                      <th>Médico</th>
                      <th>Muestra</th>
                      <th>Pago</th>
                      <th>Estatus</th>
                      <th>PDF</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citosFiltradas.map((c,i) => (
                      <tr key={i} style={{ background: seleccionados.includes(c.idCito)?'var(--rosa-paler)':'' }}>
                        <td>
                          {c.estatus==='REALIZADO' && c.urlPDF && (
                            <input type="checkbox" checked={seleccionados.includes(c.idCito)}
                              onChange={()=>toggleSeleccion(c.idCito)}
                              style={{ accentColor:'var(--rosa)', width:15, height:15 }}/>
                          )}
                        </td>
                        <td><strong style={{ color:'var(--rosa)' }}>{c.idCito}</strong></td>
                        <td style={{ fontWeight:500 }}>{c.nombre}</td>
                        <td>{c.edad}</td>
                        <td style={{ fontSize:11 }}>{c.medico}</td>
                        <td>
                          <span style={{
                            fontSize:11, padding:'2px 8px', borderRadius:12, fontWeight:600,
                            background: c.muestra==='CITOLOGIA LIQUIDA'?'#dbeafe':c.muestra==='BIOPSIA'?'#fef3c7':'var(--rosa-pale)',
                            color: c.muestra==='CITOLOGIA LIQUIDA'?'#1e40af':c.muestra==='BIOPSIA'?'#92400e':'var(--rosa)'
                          }}>{c.muestra}</span>
                        </td>
                        <td>
                          <PagoPill pago={c.pagado}/>
                        </td>
                        <td><EstatusPill estatus={c.estatus}/></td>
                        <td>
                          {c.urlPDF
                            ? <a href={c.urlPDF} target="_blank" rel="noreferrer"
                                style={{ color:'var(--rosa)', fontSize:11, fontWeight:600, textDecoration:'none' }}>
                                📄 Ver
                              </a>
                            : <span style={{ color:'var(--text-3)', fontSize:11 }}>—</span>
                          }
                        </td>
                        <td>
                          <div className="btn-group">
                            <Btn size="sm icon" icon={Edit} onClick={()=>abrirEditar(c)}/>
                            {c.urlPDF && (
                              <button onClick={()=>{
                                  const med = medicos.find(m=>m.nombre===c.medico);
                                  const num = med?.whatsapp?.replace(/\D/g,'') || '';
                                  if (!num) { mostrarToast('Este médico no tiene WhatsApp registrado','error'); return; }
                                  const msg = `Resultado citología de ${c.nombre} (${c.idCito}): ${c.urlPDF}`;
                                  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,'_blank');
                                  api.marcarEnviado(c.idCito).catch(()=>{});
                                }}
                                style={{ padding:'5px 8px', borderRadius:6, border:'none', background:'#25d366', color:'#fff', cursor:'pointer', fontSize:13 }}
                                title="Enviar por WhatsApp">
                                📱
                              </button>
                            )}
                            {c.urlPDF && (
                              <button onClick={()=>window.print()}
                                style={{ padding:'5px 8px', borderRadius:6, border:'1px solid var(--border)', background:'#fff', cursor:'pointer', fontSize:13 }}
                                title="Imprimir">
                                🖨️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </Card>

      {/* ── MODAL EDICIÓN RÁPIDA ── */}
      <Modal open={!!editModal} onClose={()=>setEditModal(null)} title={`Editar — ${editModal?.idCito}`}
        footer={
          <div className="btn-group">
            <Btn onClick={()=>setEditModal(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={guardarEdicion} disabled={guardandoEdit}>
              {guardandoEdit?'Guardando...':'Guardar cambios'}
            </Btn>
          </div>
        }>
        {editModal && (
          <div className="form-grid">
            <div className="form-group span2">
              <label className="form-label">Nombre de la paciente</label>
              <input className="form-input" value={editForm.nombre||''}
                onChange={e=>setEditForm(f=>({...f,nombre:e.target.value.toUpperCase()}))}
                style={{ textTransform:'uppercase' }}/>
            </div>
            <div className="form-group">
              <label className="form-label">Edad</label>
              <input type="number" className="form-input" value={editForm.edad||''}
                onChange={e=>setEditForm(f=>({...f,edad:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Precio ($)</label>
              <input type="number" className="form-input" value={editForm.precio||''}
                onChange={e=>setEditForm(f=>({...f,precio:e.target.value}))} step="0.5"/>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de muestra</label>
              <select className="form-select" value={editForm.muestra||''} onChange={e=>setEditForm(f=>({...f,muestra:e.target.value}))}>
                {MUESTRAS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado de pago</label>
              <select className="form-select" value={editForm.pagado||''} onChange={e=>setEditForm(f=>({...f,pagado:e.target.value}))}>
                {PAGOS.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group span2">
              <label className="form-label">Médico referidor</label>
              <input className="form-input" value={editForm.medico||''}
                onChange={e=>setEditForm(f=>({...f,medico:e.target.value.toUpperCase()}))}/>
            </div>
            <div className="form-group span2">
              <label className="form-label">Observaciones</label>
              <input className="form-input" value={editForm.observaciones||''}
                onChange={e=>setEditForm(f=>({...f,observaciones:e.target.value}))}/>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL ENVÍO WA EN LOTE ── */}
      <Modal open={waModal} onClose={()=>setWaModal(false)} title="Enviar lote por WhatsApp"
        size="sm"
        footer={<Btn onClick={()=>setWaModal(false)}>Cancelar</Btn>}>
        <div>
          <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:16 }}>
            Se enviarán <strong>{seleccionados.length}</strong> resultado(s). Seleccioná el médico al que enviar:
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {medicos.filter(m=>m.whatsapp&&m.activo==='SI').map((m,i)=>(
              <button key={i} onClick={()=>enviarLoteWA(m.whatsapp)}
                style={{ padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:'#fff', cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--rosa-paler)'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <span style={{ fontSize:13, fontWeight:500 }}>{m.nombre}</span>
                <span style={{ fontSize:11, color:'#25d366', fontWeight:600 }}>📱 {m.whatsapp}</span>
              </button>
            ))}
          </div>
          {medicos.filter(m=>m.whatsapp&&m.activo==='SI').length===0 && (
            <p style={{ color:'var(--text-3)', fontSize:12 }}>No hay médicos con WhatsApp registrado.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
