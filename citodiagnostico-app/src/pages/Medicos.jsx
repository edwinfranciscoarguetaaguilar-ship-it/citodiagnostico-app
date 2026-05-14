import { useState } from 'react';
import { Activity, Plus, Edit, Search } from 'lucide-react';
import { Card, Btn, Modal, Spinner } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

const medicoVacio = () => ({
  id:'', tipo:'MEDICO', nombre:'', especialidad:'', departamento:'San Miguel',
  municipio:'San Miguel', ubicacion:'', telefono:'', whatsapp:'', email:'',
  precioCervico:'', precioLiquida:'', precioBiopsia:'', precioCupula:'',
  preferenciaEntrega:'IMPRESO', activo:'SI', notas:''
});

const PREFERENCIAS = ['IMPRESO','WHATSAPP','AMBOS'];
const TIPOS_ENTIDAD = ['MEDICO','LABORATORIO','CLINICA'];

export default function Medicos() {
  const { medicos, setMedicos, mostrarToast } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal]       = useState(false);
  const [form,  setForm]        = useState(medicoVacio());
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const medicosFiltrados = medicos.filter(m =>
    m.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.especialidad?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.tipo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirNuevo = () => {
    setForm(medicoVacio());
    setEsEdicion(false);
    setModal(true);
  };

  const abrirEditar = (med) => {
    setForm({ ...medicoVacio(), ...med });
    setEsEdicion(true);
    setModal(true);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => {
      const nuevo = { ...f, [name]: value };
      // Calcular precio con IVA automáticamente
      if (name === 'precioCervico') {
        nuevo.precioIVA = value ? (parseFloat(value) * 1.13).toFixed(2) : '';
      }
      return nuevo;
    });
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { mostrarToast('El nombre es requerido', 'error'); return; }
    setGuardando(true);
    try {
      if (esEdicion) {
        await api.actualizarMedico(form);
        setMedicos(prev => prev.map(m => m.id === form.id ? { ...m, ...form } : m));
        mostrarToast('Médico actualizado correctamente');
      } else {
        const res = await api.guardarMedico(form);
        setMedicos(prev => [...prev, { ...form, id: res.id, activo:'SI' }]);
        mostrarToast('Médico registrado: ' + res.id);
      }
      setModal(false);
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const precioDisplay = (val) => val ? '$' + val : '—';

  return (
    <div className="fade-in">
      <Card
        title="Médicos y laboratorios referidores" icon={Activity}
        action={
          <div className="btn-group">
            <div className="search-wrap" style={{ width:240 }}>
              <Search className="search-icon" size={14}/>
              <input className="form-input" placeholder="Buscar..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}/>
            </div>
            <Btn variant="primary" icon={Plus} onClick={abrirNuevo}>Nuevo médico</Btn>
          </div>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Cervico V.</th>
                <th>Líquida</th>
                <th>Biopsia</th>
                <th>Cúpula</th>
                <th>WhatsApp</th>
                <th>Entrega</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {medicosFiltrados.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--text-3)', padding:24 }}>
                  No se encontraron médicos
                </td></tr>
              )}
              {medicosFiltrados.map((m,i) => (
                <tr key={i}>
                  <td>
                    <span style={{
                      fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:12,
                      background: m.tipo==='LABORATORIO'?'#e0f2fe':m.tipo==='CLINICA'?'#f0fdf4':'var(--rosa-pale)',
                      color: m.tipo==='LABORATORIO'?'#0369a1':m.tipo==='CLINICA'?'#065f46':'var(--rosa)'
                    }}>{m.tipo}</span>
                  </td>
                  <td style={{ fontWeight:500 }}>{m.nombre}</td>
                  <td style={{ fontSize:11, color:'var(--text-3)' }}>{m.especialidad}</td>
                  <td style={{ fontWeight:600, color:'var(--rosa)' }}>{precioDisplay(m.precioCervico)}</td>
                  <td>{precioDisplay(m.precioLiquida)}</td>
                  <td>{precioDisplay(m.precioBiopsia)}</td>
                  <td>{precioDisplay(m.precioCupula)}</td>
                  <td style={{ fontSize:11 }}>
                    {m.whatsapp
                      ? <a href={`https://wa.me/${String(m.whatsapp).replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                          style={{ color:'#25d366', fontWeight:600, textDecoration:'none' }}>
                          📱 {m.whatsapp}
                        </a>
                      : <span style={{ color:'var(--text-3)' }}>—</span>
                    }
                  </td>
                  <td>
                    <span style={{
                      fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:12,
                      background: m.preferenciaEntrega==='WHATSAPP'?'#dcfce7':m.preferenciaEntrega==='AMBOS'?'#dbeafe':'var(--bg2)',
                      color: m.preferenciaEntrega==='WHATSAPP'?'#065f46':m.preferenciaEntrega==='AMBOS'?'#1e40af':'var(--text-3)'
                    }}>
                      {m.preferenciaEntrega==='WHATSAPP'?'📱 WhatsApp':m.preferenciaEntrega==='AMBOS'?'📱🖨️ Ambos':'🖨️ Impreso'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize:10, fontWeight:600, color: m.activo==='SI'?'#0a6640':'#991b1b' }}>
                      {m.activo==='SI'?'Activo':'Inactivo'}
                    </span>
                  </td>
                  <td><Btn size="sm icon" icon={Edit} onClick={() => abrirEditar(m)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--text-3)' }}>
          {medicosFiltrados.length} de {medicos.length} registros
        </div>
      </Card>

      {/* ── MODAL NUEVO / EDITAR ── */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={esEdicion ? 'Editar médico / laboratorio' : 'Nuevo médico / laboratorio'}
        size="lg"
        footer={
          <div className="btn-group">
            <Btn onClick={() => setModal(false)}>Cancelar</Btn>
            {esEdicion && (
              <Btn variant="danger" onClick={async () => {
                await api.actualizarMedico({ ...form, activo: form.activo==='SI'?'NO':'SI' });
                setMedicos(prev => prev.map(m => m.id===form.id ? {...m, activo:form.activo==='SI'?'NO':'SI'} : m));
                mostrarToast(form.activo==='SI'?'Médico desactivado':'Médico activado');
                setModal(false);
              }}>
                {form.activo==='SI'?'Desactivar':'Activar'}
              </Btn>
            )}
            <Btn variant="primary" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Btn>
          </div>
        }
      >
        <div className="form-grid">
          {/* Tipo */}
          <div className="form-group">
            <label className="form-label">Tipo de entidad</label>
            <div style={{ display:'flex', gap:8 }}>
              {TIPOS_ENTIDAD.map(t => (
                <label key={t} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, cursor:'pointer' }}>
                  <input type="radio" name="tipo" value={t} checked={form.tipo===t}
                    onChange={handleChange} style={{ accentColor:'var(--rosa)' }}/>
                  {t.charAt(0)+t.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" name="activo" value={form.activo} onChange={handleChange}>
              <option value="SI">Activo</option>
              <option value="NO">Inactivo</option>
            </select>
          </div>

          {/* Nombre */}
          <div className="form-group span2">
            <label className="form-label">Nombre completo</label>
            <input className="form-input" name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Dra. / Dr. / Lab. nombre completo" style={{ textTransform:'uppercase' }}/>
          </div>

          <div className="form-group">
            <label className="form-label">Especialidad</label>
            <input className="form-input" name="especialidad" value={form.especialidad} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label className="form-label">Correo (portal médicos)</label>
            <input type="email" className="form-input" name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com"/>
          </div>
          <div className="form-group">
            <label className="form-label">Departamento</label>
            <input className="form-input" name="departamento" value={form.departamento} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label className="form-label">Municipio</label>
            <input className="form-input" name="municipio" value={form.municipio} onChange={handleChange}/>
          </div>
          <div className="form-group span2">
            <label className="form-label">Dirección / Clínica</label>
            <input className="form-input" name="ubicacion" value={form.ubicacion} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-input" name="telefono" value={form.telefono} onChange={handleChange} placeholder="0000-0000"/>
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp (para envío de PDF)</label>
            <input className="form-input" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+50300000000"/>
          </div>

          {/* Precios */}
          <div className="form-section-title">Precios acordados por tipo de muestra</div>
          <div className="form-group">
            <label className="form-label">Cervico vaginal ($)</label>
            <input type="number" className="form-input" name="precioCervico" value={form.precioCervico} onChange={handleChange} step="0.5"/>
          </div>
          <div className="form-group">
            <label className="form-label">Precio c/IVA 13% (auto)</label>
            <input className="form-input" readOnly value={form.precioIVA || (form.precioCervico?(parseFloat(form.precioCervico)*1.13).toFixed(2):'')}/>
          </div>
          <div className="form-group">
            <label className="form-label">Citología líquida ($)</label>
            <input type="number" className="form-input" name="precioLiquida" value={form.precioLiquida} onChange={handleChange} step="0.5"/>
          </div>
          <div className="form-group">
            <label className="form-label">Biopsia ($)</label>
            <input type="number" className="form-input" name="precioBiopsia" value={form.precioBiopsia} onChange={handleChange} step="0.5"/>
          </div>
          <div className="form-group">
            <label className="form-label">Cúpula vaginal ($)</label>
            <input type="number" className="form-input" name="precioCupula" value={form.precioCupula} onChange={handleChange} step="0.5"/>
          </div>

          {/* Preferencia de entrega */}
          <div className="form-section-title">Preferencia de entrega de resultados</div>
          <div className="form-group span2">
            <div style={{ display:'flex', gap:10 }}>
              {PREFERENCIAS.map(p => (
                <label key={p} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                  borderRadius:8, border:'1px solid',
                  borderColor: form.preferenciaEntrega===p?'var(--rosa)':'var(--border)',
                  background: form.preferenciaEntrega===p?'var(--rosa-pale)':'#fff',
                  cursor:'pointer', fontSize:12, fontWeight:500,
                  color: form.preferenciaEntrega===p?'var(--rosa)':'var(--text-3)'
                }}>
                  <input type="radio" name="preferenciaEntrega" value={p}
                    checked={form.preferenciaEntrega===p} onChange={handleChange}
                    style={{ display:'none' }}/>
                  {p==='IMPRESO'?'🖨️ Impreso':p==='WHATSAPP'?'📱 WhatsApp':'📱🖨️ Ambos'}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group span2">
            <label className="form-label">Notas adicionales</label>
            <textarea className="form-textarea" name="notas" value={form.notas} onChange={handleChange} rows={2}/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
