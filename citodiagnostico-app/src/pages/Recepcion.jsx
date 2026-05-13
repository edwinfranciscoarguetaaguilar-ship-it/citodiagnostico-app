import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, Save, Trash2, Edit, X } from 'lucide-react';
import { Card, Btn, PagoPill, Spinner } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

const MUESTRAS = ['CERVICO VAGINAL','CUPULA VAGINAL','CITOLOGIA LIQUIDA','BIOPSIA'];
const PAGOS    = ['PAGADO','PENDIENTE','TRANSFERENCIA'];

const formVacio = (idCito) => ({
  idCito, nombre:'', edad:'', muestra:'CERVICO VAGINAL',
  medico:'', precio:'', pagado:'PAGADO', fecha:hoy(),
  observaciones:''
});

function hoy() {
  return new Date().toISOString().slice(0,10);
}

export default function Recepcion() {
  const { medicos, siguienteId, setSiguienteId, mostrarToast } = useApp();
  const [form,    setForm]    = useState(formVacio(siguienteId));
  const [lote,    setLote]    = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Buscador de médico
  const [medicoQuery, setMedicoQuery] = useState('');
  const [medicoOpen,  setMedicoOpen]  = useState(false);
  const medicoRef = useRef(null);

  // Sync id cuando cambia siguienteId
  useEffect(() => {
    setForm(f => ({ ...f, idCito: siguienteId }));
  }, [siguienteId]);

  // Cerrar dropdown al click afuera
  useEffect(() => {
    const handler = e => { if (medicoRef.current && !medicoRef.current.contains(e.target)) setMedicoOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Precio automático al seleccionar médico + muestra (siempre actualiza pero deja editar)
  const [precioManual, setPrecioManual] = useState(false);
  useEffect(() => {
    if (!form.medico || !form.muestra || precioManual) return;
    const med = medicos.find(m => m.nombre === form.medico);
    if (!med) return;
    let precio = '';
    if (form.muestra === 'CERVICO VAGINAL')   precio = med.precioCervico;
    else if (form.muestra === 'CITOLOGIA LIQUIDA') precio = med.precioLiquida;
    else if (form.muestra === 'BIOPSIA')       precio = med.precioBiopsia;
    else if (form.muestra === 'CUPULA VAGINAL') precio = med.precioCupula || med.precioCervico;
    if (precio !== undefined && precio !== '') setForm(f => ({ ...f, precio: String(precio) }));
  }, [form.medico, form.muestra]);

  const medicosFiltrados = medicos.filter(m =>
    m.activo === 'SI' &&
    (medicoQuery === '' || m.nombre.toLowerCase().includes(medicoQuery.toLowerCase()))
  );

  const seleccionarMedico = (med) => {
    setForm(f => ({ ...f, medico: med.nombre }));
    setMedicoQuery(med.nombre);
    setMedicoOpen(false);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const setPago = (p) => setForm(f => ({ ...f, pagado: p }));

  const incrementarId = (idActual) => {
    const partes = idActual.split('-');
    if (partes.length === 2) {
      return (parseInt(partes[0]) + 1) + '-' + partes[1];
    }
    return idActual;
  };

  const agregarAlLote = () => {
    if (!form.nombre.trim()) { mostrarToast('El nombre de la paciente es requerido', 'error'); return; }
    if (!form.medico)        { mostrarToast('Seleccione un médico referidor', 'error'); return; }
    if (!form.muestra)       { mostrarToast('Seleccione el tipo de muestra', 'error'); return; }

    if (editIdx !== null) {
      const nuevo = [...lote];
      nuevo[editIdx] = { ...form };
      setLote(nuevo);
      setEditIdx(null);
    } else {
      setLote(prev => [...prev, { ...form }]);
    }

    const nextId = incrementarId(form.idCito);
    setSiguienteId(nextId);
    setForm(formVacio(nextId));
    setMedicoQuery('');
    setPrecioManual(false);
  };

  const editarDeLote = (idx) => {
    const item = lote[idx];
    setForm({ ...item });
    setMedicoQuery(item.medico);
    setEditIdx(idx);
  };

  const eliminarDeLote = (idx) => {
    setLote(prev => prev.filter((_,i) => i !== idx));
    if (editIdx === idx) { setEditIdx(null); setForm(formVacio(siguienteId)); setMedicoQuery(''); }
  };

  const guardarLote = async () => {
    if (lote.length === 0) { mostrarToast('Añadí al menos una muestra', 'error'); return; }
    setGuardando(true);
    try {
      const res = await api.registrarLote(lote);
      mostrarToast(res.mensaje || 'Lote guardado correctamente');
      setLote([]);
      // Refrescar siguiente ID desde la API
      const idRes = await api.getSiguienteId();
      setSiguienteId(idRes.idCito);
      setForm(formVacio(idRes.idCito));
      setMedicoQuery('');
    } catch (e) {
      mostrarToast('Error guardando: ' + e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const limpiarForm = () => {
    setEditIdx(null);
    setForm(formVacio(siguienteId));
    setMedicoQuery('');
    setPrecioManual(false);
  };

  return (
    <div className="fade-in">
      {/* ── FORMULARIO ── */}
      <Card title="Registrar citologías — Lote del día" icon={ClipboardList}
        action={
          <div className="btn-group">
            <Btn onClick={limpiarForm}>Limpiar</Btn>
            <Btn variant="primary" icon={editIdx!==null?Edit:Plus} onClick={agregarAlLote}>
              {editIdx!==null ? 'Actualizar en lote' : 'Añadir al lote'}
            </Btn>
          </div>
        }
      >
        <div className="form-grid" style={{ padding:20 }}>
          {/* Fila 1: Fecha · ID Cito · Edad · Médico · Precio */}
          <div className="form-group">
            <label className="form-label">Fecha de recepción</label>
            <input type="date" name="fecha" className="form-input" value={form.fecha} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label className="form-label"># Citología</label>
            <input name="idCito" className="form-input highlight" value={form.idCito} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label className="form-label">Edad</label>
            <input type="number" name="edad" className="form-input" value={form.edad} onChange={handleChange} placeholder="Años" min="1" max="120"/>
          </div>
          {/* Médico con buscador */}
          <div className="form-group" ref={medicoRef} style={{ position:'relative' }}>
            <label className="form-label">Médico referidor</label>
            <input
              className="form-input"
              placeholder="Buscar médico..."
              value={medicoQuery}
              onChange={e => { setMedicoQuery(e.target.value); setMedicoOpen(true); }}
              onFocus={() => setMedicoOpen(true)}
              autoComplete="off"
            />
            {medicoOpen && medicosFiltrados.length > 0 && (
              <div style={{
                position:'absolute', top:'100%', left:0, right:0, zIndex:50,
                background:'#fff', border:'1px solid var(--border)',
                borderRadius:7, boxShadow:'var(--shadow)', maxHeight:200,
                overflowY:'auto'
              }}>
                {medicosFiltrados.map((m,i) => {
                    let precioRef = '';
                    if (form.muestra === 'CERVICO VAGINAL') precioRef = m.precioCervico;
                    else if (form.muestra === 'CITOLOGIA LIQUIDA') precioRef = m.precioLiquida;
                    else if (form.muestra === 'BIOPSIA') precioRef = m.precioBiopsia;
                    else if (form.muestra === 'CUPULA VAGINAL') precioRef = m.precioCupula || m.precioCervico;
                    return (
                      <div key={i}
                        onMouseDown={() => { seleccionarMedico(m); setPrecioManual(false); }}
                        style={{ padding:'9px 14px', cursor:'pointer', fontSize:12, borderBottom:'1px solid #fdf4f8', color:'var(--text-2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--rosa-paler)'}
                        onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                        <span>
                          <span style={{ fontWeight:500 }}>{m.nombre}</span>
                          <span style={{ color:'var(--text-3)', marginLeft:8, fontSize:10 }}>{m.tipo}</span>
                        </span>
                        {precioRef && <span style={{ color:'var(--rosa)', fontWeight:700, fontSize:12 }}>${precioRef}</span>}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Precio ($) <span style={{ color:'var(--text-3)', fontWeight:400, fontSize:10 }}>— auto según médico, editable</span></label>
            <input type="number" name="precio" className="form-input" value={form.precio}
              onChange={e => { setPrecioManual(true); handleChange(e); }}
              onBlur={() => {}} step="0.50" min="0"
              style={{ borderColor: precioManual ? 'var(--rosa-light)' : '' }}/>
          </div>
          {/* Fila 2: Nombre (ancho completo) */}
          <div className="form-group span2">
            <label className="form-label">Nombre de la paciente</label>
            <input
              name="nombre" className="form-input"
              value={form.nombre} onChange={handleChange}
              placeholder="NOMBRE COMPLETO EN MAYÚSCULAS"
              style={{ textTransform:'uppercase' }}
            />
          </div>
          {/* Muestra */}
          <div className="form-group">
            <label className="form-label">Tipo de muestra</label>
            <select name="muestra" className="form-select" value={form.muestra} onChange={handleChange}>
              {MUESTRAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {/* Estado de pago — botones */}
          <div className="form-group">
            <label className="form-label">Estado de pago</label>
            <div style={{ display:'flex', gap:6, marginTop:2 }}>
              {PAGOS.map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setPago(p)}
                  style={{
                    flex:1, padding:'8px 4px', borderRadius:7, fontSize:11, fontWeight:600,
                    border:'1px solid',
                    cursor:'pointer',
                    borderColor: form.pagado===p ? 'var(--rosa)' : 'var(--border)',
                    background:  form.pagado===p
                      ? p==='PAGADO'?'#d1fae5': p==='PENDIENTE'?'#fde8e8':'#dbeafe'
                      : '#fff',
                    color: form.pagado===p
                      ? p==='PAGADO'?'#065f46': p==='PENDIENTE'?'#991b1b':'#1e40af'
                      : 'var(--text-3)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group span2">
            <label className="form-label">Observaciones (opcional)</label>
            <input name="observaciones" className="form-input" value={form.observaciones} onChange={handleChange} placeholder="Notas de recepción..."/>
          </div>
        </div>
      </Card>

      {/* ── LOTE ACTUAL ── */}
      <Card
        title={`Lote actual — ${lote.length} registro${lote.length!==1?'s':''}`}
        icon={ClipboardList}
        action={
          <div className="btn-group">
            <Btn variant="danger" icon={X} onClick={() => { setLote([]); limpiarForm(); }}>Cancelar lote</Btn>
            <Btn variant="primary" icon={Save} onClick={guardarLote} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar todo en Sheets'}
            </Btn>
          </div>
        }
      >
        {lote.length === 0
          ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13, textAlign:'center' }}>
              No hay registros en el lote. Completá el formulario y hacé clic en "Añadir al lote".
            </div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr><th># Cito</th><th>Fecha</th><th>Paciente</th><th>Edad</th><th>Médico</th><th>Muestra</th><th>Precio</th><th>Pago</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {lote.map((item,i) => (
                    <tr key={i} style={{ background: editIdx===i?'var(--rosa-paler)':'' }}>
                      <td><strong style={{ color:'var(--rosa)' }}>{item.idCito}</strong></td>
                      <td style={{ fontSize:11 }}>{item.fecha}</td>
                      <td style={{ fontWeight:500 }}>{item.nombre}</td>
                      <td>{item.edad}</td>
                      <td style={{ fontSize:11 }}>{item.medico}</td>
                      <td style={{ fontSize:11 }}>{item.muestra}</td>
                      <td>${item.precio}</td>
                      <td><PagoPill pago={item.pagado}/></td>
                      <td>
                        <div className="btn-group">
                          <Btn size="sm icon" icon={Edit}  onClick={() => editarDeLote(i)}/>
                          <Btn size="sm icon" variant="danger" icon={Trash2} onClick={() => eliminarDeLote(i)}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>
    </div>
  );
}
