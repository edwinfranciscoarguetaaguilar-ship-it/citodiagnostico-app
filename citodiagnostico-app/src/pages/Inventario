import { useState, useEffect } from 'react';
import { Card, Btn, Modal, Spinner } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

function hoy() { return new Date().toISOString().slice(0, 10); }

const MODALIDADES = ['COMODATO', 'PAGADO'];

export default function Inventario() {
  const { medicos, mostrarToast } = useApp();
  const [data,     setData]     = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab,      setTab]      = useState('entregas');
  const [modalEntrega, setModalEntrega] = useState(false);
  const [modalStock,   setModalStock]   = useState(false);
  const [guardando,    setGuardando]    = useState(false);
  const [medicoQuery,  setMedicoQuery]  = useState('');
  const [medicoOpen,   setMedicoOpen]   = useState(false);

  const [formE, setFormE] = useState({
    fecha: hoy(), medico: '', cantidad: 1,
    precioUnit: '', modalidad: 'COMODATO', notas: ''
  });
  const [formS, setFormS] = useState({
    fecha: hoy(), cantidad: '', costoUnit: '',
    proveedor: '', factura: '', notas: ''
  });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.getResumenInventario();
      setData(res);
    } catch (e) {
      mostrarToast('Error cargando inventario: ' + e.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const medicosFiltrados = medicos.filter(m =>
    m.activo === 'SI' &&
    (medicoQuery === '' || m.nombre.toLowerCase().includes(medicoQuery.toLowerCase()))
  );

  const seleccionarMedico = (med) => {
    setMedicoQuery(med.nombre);
    setMedicoOpen(false);
    setFormE(f => ({ ...f, medico: med.nombre, precioUnit: med.precioLiquida || '' }));
  };

  const guardarEntrega = async () => {
    if (!formE.medico) { mostrarToast('Selecciona un medico', 'error'); return; }
    if (!formE.precioUnit) { mostrarToast('Ingresa el precio', 'error'); return; }
    setGuardando(true);
    try {
      await api.registrarEntrega(formE);
      mostrarToast('Entrega registrada');
      setModalEntrega(false);
      setFormE({ fecha: hoy(), medico: '', cantidad: 1, precioUnit: '', modalidad: 'COMODATO', notas: '' });
      setMedicoQuery('');
      cargar();
    } catch (e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const guardarStock = async () => {
    if (!formS.cantidad) { mostrarToast('Ingresa la cantidad', 'error'); return; }
    setGuardando(true);
    try {
      await api.registrarStockEntrada(formS);
      mostrarToast('Ingreso registrado');
      setModalStock(false);
      setFormS({ fecha: hoy(), cantidad: '', costoUnit: '', proveedor: '', factura: '', notas: '' });
      cargar();
    } catch (e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const marcarPagado = async (id) => {
    try {
      await api.marcarEntregaPagada(id);
      mostrarToast('Marcado como pagado');
      cargar();
    } catch (e) { mostrarToast('Error: ' + e.message, 'error'); }
  };

  const marcarRetirado = async (id) => {
    try {
      await api.marcarRetirado(id);
      mostrarToast('Marcado como retirado');
      cargar();
    } catch (e) { mostrarToast('Error: ' + e.message, 'error'); }
  };

  const s = data?.stock || {};
  const entregas = data?.entregas || [];
  const historial = data?.historialStock || [];
  const alertas = entregas.filter(e => e.alerta);

  return (
    <div className="fade-in">

      {cargando ? (
        <div style={{ padding: 60, textAlign: 'center' }}><Spinner /></div>
      ) : (
        <>
          {/* Metricas */}
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div className="metric-card accent">
              <div className="metric-label">Disponible</div>
              <div className="metric-value">{s.disponible || 0}</div>
              <div className="metric-sub">frascos en laboratorio</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">En clinicas</div>
              <div className="metric-value" style={{ color: '#856404' }}>{s.enClinicas || 0}</div>
              <div className="metric-sub">frascos entregados</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Pendiente cobro</div>
              <div className="metric-value" style={{ color: '#991b1b' }}>${parseFloat(s.pendientePago || 0).toFixed(2)}</div>
              <div className="metric-sub">comodatos sin pagar</div>
            </div>
            <div className="metric-card" style={{ borderColor: s.alertas > 0 ? '#f87171' : '' }}>
              <div className="metric-label">Alertas +15 dias</div>
              <div className="metric-value" style={{ color: s.alertas > 0 ? '#991b1b' : '#0a6640' }}>{s.alertas || 0}</div>
              <div className="metric-sub">sin pago pendiente</div>
            </div>
          </div>

          {/* Banner alertas */}
          {alertas.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 18px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                Alertas: {alertas.length} entrega(s) con mas de 15 dias sin pago
              </div>
              {alertas.map((a, i) => (
                <div key={i} style={{ fontSize: 12, color: '#7f1d1d', marginBottom: 4 }}>
                  {a.medico} — {a.cantidad} frasco(s) el {a.fechaEntrega} ({a.diasFuera} dias) — Saldo: {a.saldoFrascos} — ${a.total}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Card principal */}
      <Card>
        <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div className="tabs" style={{ flex: 1 }}>
            <button className={`tab-btn ${tab === 'entregas' ? 'active' : ''}`} onClick={() => setTab('entregas')}>
              Entregas a medicos
            </button>
            <button className={`tab-btn ${tab === 'stock' ? 'active' : ''}`} onClick={() => setTab('stock')}>
              Historial stock
            </button>
          </div>
          <Btn onClick={cargar} disabled={cargando}>Actualizar</Btn>
          <Btn onClick={() => setModalStock(true)}>+ Ingreso frascos</Btn>
          <Btn variant="primary" onClick={() => setModalEntrega(true)}>Registrar entrega</Btn>
        </div>

        {/* Tab entregas */}
        {tab === 'entregas' && (
          entregas.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>No hay entregas registradas</div>
            : <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Medico</th><th>Fecha</th><th>Cant</th><th>Precio</th>
                      <th>Total</th><th>Modalidad</th><th>Pago</th>
                      <th>Muestras</th><th>Saldo</th><th>Dias</th><th>Estado</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entregas.map((e, i) => (
                      <tr key={i} style={{
                        background: e.alerta ? '#fff5f5' : e.estado === 'COBRADO' ? '#f0fdf4' : e.estado === 'RETIRADO' ? '#f8f8f8' : ''
                      }}>
                        <td style={{ fontWeight: 500 }}>{e.medico}</td>
                        <td style={{ fontSize: 11 }}>{e.fechaEntrega}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{e.cantidad}</td>
                        <td>${parseFloat(e.precioUnit || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }}>${parseFloat(e.total || 0).toFixed(2)}</td>
                        <td>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                            background: e.modalidad === 'PAGADO' ? '#d1fae5' : '#fef3c7',
                            color: e.modalidad === 'PAGADO' ? '#065f46' : '#92400e'
                          }}>{e.modalidad}</span>
                        </td>
                        <td style={{ fontSize: 11, fontWeight: 600, color: e.pagado ? '#065f46' : '#991b1b' }}>
                          {e.pagado ? 'Pagado' : 'Pendiente'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#1e40af' }}>{e.muestrasRecib}</span>
                          <span style={{ color: 'var(--text-3)', fontSize: 11 }}> / {e.cantidad}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: e.saldoFrascos === 0 ? '#065f46' : '#856404' }}>
                          {e.saldoFrascos}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: e.diasFuera >= 15 && !e.pagado && e.estado === 'ACTIVO' ? '#991b1b' : e.diasFuera >= 7 ? '#856404' : 'var(--text-2)' }}>
                          {e.diasFuera}d
                        </td>
                        <td>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                            background: e.estado === 'COBRADO' ? '#d1fae5' : e.estado === 'RETIRADO' ? '#e5e7eb' : '#fef3c7',
                            color: e.estado === 'COBRADO' ? '#065f46' : e.estado === 'RETIRADO' ? '#374151' : '#92400e'
                          }}>{e.estado}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {e.estado === 'ACTIVO' && !e.pagado && (
                              <button onClick={() => marcarPagado(e.id)}
                                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#d1fae5', color: '#065f46', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                                Pagado
                              </button>
                            )}
                            {e.estado === 'ACTIVO' && !e.pagado && e.diasFuera >= 15 && (
                              <button onClick={() => marcarRetirado(e.id)}
                                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                                Retirar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}

        {/* Tab stock */}
        {tab === 'stock' && (
          <div>
            <div style={{ padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 13, display: 'flex', gap: 20 }}>
              <span>Total comprado: <strong>{s.totalComprado || 0}</strong></span>
              <span>Entregado: <strong>{s.totalEntregado || 0}</strong></span>
              <span>Disponible: <strong style={{ color: 'var(--rosa)' }}>{s.disponible || 0}</strong></span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Cantidad</th><th>Costo unit</th><th>Total</th><th>Proveedor</th><th>Factura</th></tr></thead>
                <tbody>
                  {historial.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>Sin ingresos registrados</td></tr>
                  )}
                  {historial.map((h, i) => (
                    <tr key={i}>
                      <td>{h.fecha}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{h.cantidad}</td>
                      <td>${h.costoUnit}</td>
                      <td style={{ fontWeight: 700 }}>${h.total}</td>
                      <td style={{ fontSize: 11 }}>{h.proveedor || '-'}</td>
                      <td style={{ fontSize: 11 }}>{h.factura || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Modal entrega */}
      <Modal open={modalEntrega} onClose={() => setModalEntrega(false)}
        title="Registrar entrega de frascos"
        footer={
          <div className="btn-group">
            <Btn onClick={() => setModalEntrega(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={guardarEntrega} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Registrar'}
            </Btn>
          </div>
        }>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input type="date" className="form-input" value={formE.fecha}
              onChange={e => setFormE(f => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input type="number" className="form-input" min="1" value={formE.cantidad}
              onChange={e => setFormE(f => ({ ...f, cantidad: e.target.value }))} />
          </div>
          <div className="form-group span2" style={{ position: 'relative' }}>
            <label className="form-label">Medico</label>
            <input className="form-input" placeholder="Buscar medico..."
              value={medicoQuery}
              onChange={e => { setMedicoQuery(e.target.value); setMedicoOpen(true); }}
              onFocus={() => setMedicoOpen(true)}
              autoComplete="off" />
            {medicoOpen && medicosFiltrados.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow)', maxHeight: 200, overflowY: 'auto' }}>
                {medicosFiltrados.map((m, i) => (
                  <div key={i} onMouseDown={() => seleccionarMedico(m)}
                    style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #fdf4f8', display: 'flex', justifyContent: 'space-between' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--rosa-paler)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <span style={{ fontWeight: 500 }}>{m.nombre}</span>
                    {m.precioLiquida && <span style={{ color: 'var(--rosa)', fontWeight: 700 }}>${m.precioLiquida}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Precio por frasco ($)</label>
            <input type="number" className="form-input" step="0.5" value={formE.precioUnit}
              onChange={e => setFormE(f => ({ ...f, precioUnit: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Total</label>
            <input className="form-input" readOnly
              value={'$' + ((formE.cantidad || 0) * (formE.precioUnit || 0)).toFixed(2)} />
          </div>
          <div className="form-group span2">
            <label className="form-label">Modalidad</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {MODALIDADES.map(m => (
                <label key={m} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  borderColor: formE.modalidad === m ? 'var(--rosa)' : 'var(--border)',
                  background: formE.modalidad === m ? 'var(--rosa-pale)' : '#fff',
                  color: formE.modalidad === m ? 'var(--rosa)' : 'var(--text-3)'
                }}>
                  <input type="radio" name="modalidad" value={m}
                    checked={formE.modalidad === m}
                    onChange={() => setFormE(f => ({ ...f, modalidad: m }))}
                    style={{ display: 'none' }} />
                  {m === 'PAGADO' ? 'Pagado al entregar' : 'Comodato (paga despues)'}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group span2">
            <label className="form-label">Notas</label>
            <input className="form-input" value={formE.notas}
              onChange={e => setFormE(f => ({ ...f, notas: e.target.value }))}
              placeholder="Observaciones opcionales..." />
          </div>
        </div>
      </Modal>

      {/* Modal stock */}
      <Modal open={modalStock} onClose={() => setModalStock(false)}
        title="Registrar ingreso de frascos"
        footer={
          <div className="btn-group">
            <Btn onClick={() => setModalStock(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={guardarStock} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Registrar'}
            </Btn>
          </div>
        }>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Fecha de compra</label>
            <input type="date" className="form-input" value={formS.fecha}
              onChange={e => setFormS(f => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input type="number" className="form-input" min="1" value={formS.cantidad}
              onChange={e => setFormS(f => ({ ...f, cantidad: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Costo unitario ($)</label>
            <input type="number" className="form-input" step="0.5" value={formS.costoUnit}
              onChange={e => setFormS(f => ({ ...f, costoUnit: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Total</label>
            <input className="form-input" readOnly
              value={'$' + ((formS.cantidad || 0) * (formS.costoUnit || 0)).toFixed(2)} />
          </div>
          <div className="form-group">
            <label className="form-label">Proveedor</label>
            <input className="form-input" value={formS.proveedor}
              onChange={e => setFormS(f => ({ ...f, proveedor: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">No. de factura</label>
            <input className="form-input" value={formS.factura}
              onChange={e => setFormS(f => ({ ...f, factura: e.target.value }))} />
          </div>
          <div className="form-group span2">
            <label className="form-label">Notas</label>
            <input className="form-input" value={formS.notas}
              onChange={e => setFormS(f => ({ ...f, notas: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
