import { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle } from 'lucide-react';
import { Card, Btn, PagoPill, Modal, Spinner } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function Facturacion() {
  const { medicos, mostrarToast } = useApp();
  const ahora = new Date();
  const [mes,    setMes]    = useState(String(ahora.getMonth() + 1).padStart(2,'0'));
  const [anio,   setAnio]   = useState(String(ahora.getFullYear()));
  const [filtroM,setFiltroM]= useState('');
  const [data,   setData]   = useState([]);
  const [cargando, setCargando] = useState(false);
  const [detalleModal, setDetalleModal] = useState(null); // médico seleccionado para ver detalle

  useEffect(() => { cargar(); }, [mes, anio]);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.getResumenMes(mes, anio);
      setData(res);
    } catch(e) {
      mostrarToast('Error cargando facturación: ' + e.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const datosFiltrados = data
    .filter(d => filtroM === '' || d.medico.toLowerCase().includes(filtroM.toLowerCase()))
    // Solo médicos con registros (data ya viene filtrada del GAS, pero por si acaso)
    .filter(d => d.totalCitos > 0)
    // Pendientes primero, luego por monto total
    .sort((a, b) => {
      const pendA = parseFloat(a.pendiente || 0);
      const pendB = parseFloat(b.pendiente || 0);
      if (pendB !== pendA) return pendB - pendA;
      return parseFloat(b.montoTotal || 0) - parseFloat(a.montoTotal || 0);
    });

  const totalGeneral  = datosFiltrados.reduce((s,d) => s + parseFloat(d.montoTotal||0), 0);
  const totalPagado   = datosFiltrados.reduce((s,d) => s + parseFloat(d.pagado||0), 0);
  const totalPendiente= datosFiltrados.reduce((s,d) => s + parseFloat(d.pendiente||0), 0);
  const totalTransfer = datosFiltrados.reduce((s,d) => s + parseFloat(d.transferencia||0), 0);

  const marcarPagado = async (idCito) => {
    try {
      await api.actualizarPago(idCito, 'PAGADO');
      mostrarToast('Marcado como PAGADO: ' + idCito);
      // Actualizar estado local
      setDetalleModal(prev => ({
        ...prev,
        detalle: prev.detalle.map(d => d.idCito===idCito ? {...d, pagado:'PAGADO'} : d)
      }));
      cargar();
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    }
  };

  const pagarTodas = async () => {
    const pendientes = (detalleModal?.detalle || []).filter(d => d.pagado === 'PENDIENTE');
    if (!pendientes.length) { mostrarToast('No hay pendientes', 'error'); return; }
    try {
      await Promise.all(pendientes.map(d => api.actualizarPago(d.idCito, 'PAGADO')));
      mostrarToast(pendientes.length + ' citologias marcadas como pagadas');
      setDetalleModal(prev => ({
        ...prev,
        detalle: prev.detalle.map(d => ({ ...d, pagado: 'PAGADO' }))
      }));
      cargar();
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    }
  };

  const exportarCSV = () => {
    const rows = [
      ['Médico','Total citos','Monto total','Pagado','Transferencia','Pendiente'],
      ...datosFiltrados.map(d => [d.medico, d.totalCitos, d.montoTotal, d.pagado, d.transferencia, d.pendiente])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`facturacion-${mes}-${anio}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const meses = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const nomMeses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div className="fade-in">
      {/* ── FILTROS ── */}
      <Card>
        <div style={{ padding:'14px 20px', display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Mes</label>
            <select className="form-select" value={mes} onChange={e => setMes(e.target.value)} style={{ width:140 }}>
              {meses.map((m,i) => <option key={m} value={m}>{nomMeses[i]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Año</label>
            <select className="form-select" value={anio} onChange={e => setAnio(e.target.value)} style={{ width:100 }}>
              {['2024','2025','2026','2027'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:1, minWidth:200 }}>
            <label className="form-label">Filtrar por médico</label>
            <input className="form-input" placeholder="Nombre del médico..."
              value={filtroM} onChange={e => setFiltroM(e.target.value)}/>
          </div>
          <Btn variant="primary" onClick={cargar}>Actualizar</Btn>
          <Btn icon={Download} onClick={exportarCSV}>Exportar CSV</Btn>
        </div>
      </Card>

      {/* ── RESUMEN TOTALES ── */}
      <div className="metrics-grid" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="metric-card">
          <div className="metric-label">Total mes</div>
          <div className="metric-value">${totalGeneral.toFixed(2)}</div>
          <div className="metric-sub">{datosFiltrados.reduce((s,d)=>s+d.totalCitos,0)} citologías</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cobrado</div>
          <div className="metric-value" style={{ color:'#0a6640' }}>${totalPagado.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Transferencias</div>
          <div className="metric-value" style={{ color:'#1e40af' }}>${totalTransfer.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pendiente por cobrar</div>
          <div className="metric-value" style={{ color:'#991b1b' }}>${totalPendiente.toFixed(2)}</div>
        </div>
      </div>

      {/* ── TABLA PRINCIPAL ── */}
      <Card title={`Facturación — ${nomMeses[parseInt(mes)-1]} ${anio}`} icon={FileText}>
        {cargando
          ? <div style={{ padding:40, textAlign:'center' }}><Spinner/></div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Médico</th><th>Citos</th><th>Monto total</th>
                    <th>Pagado</th><th>Transferencia</th><th>Pendiente</th>
                    <th>Saldo</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-3)', padding:24 }}>
                      Sin datos para el período seleccionado
                    </td></tr>
                  )}
                  {datosFiltrados.map((d,i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{d.medico}</td>
                      <td>{d.totalCitos}</td>
                      <td style={{ fontWeight:600 }}>${d.montoTotal}</td>
                      <td><span style={{ color:'#0a6640', fontWeight:600 }}>${d.pagado}</span></td>
                      <td><span style={{ color:'#1e40af', fontWeight:600 }}>${d.transferencia}</span></td>
                      <td><span style={{ color: parseFloat(d.pendiente)>0?'#991b1b':'var(--text-3)', fontWeight:600 }}>${d.pendiente}</span></td>
                      <td>
                        {parseFloat(d.saldo) > 0
                          ? <span style={{ color:'#991b1b', fontWeight:700 }}>${d.saldo}</span>
                          : <span style={{ color:'#0a6640' }}>✅ Al día</span>
                        }
                      </td>
                      <td>
                        <Btn size="sm" onClick={() => setDetalleModal(d)}>Ver detalle</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totales */}
              <div className="fin-total-bar">
                <span>Total: <strong>${totalGeneral.toFixed(2)}</strong></span>
                <span style={{ color:'#0a6640' }}>Cobrado: <strong>${totalPagado.toFixed(2)}</strong></span>
                <span style={{ color:'#1e40af' }}>Transferencia: <strong>${totalTransfer.toFixed(2)}</strong></span>
                <span style={{ color:'#991b1b' }}>Pendiente: <strong>${totalPendiente.toFixed(2)}</strong></span>
              </div>
            </div>
        }
      </Card>

      {/* ── MODAL DETALLE DE MÉDICO ── */}
      <Modal
        open={!!detalleModal}
        onClose={() => setDetalleModal(null)}
        title={detalleModal ? `Detalle — ${detalleModal.medico}` : ''}
        size="lg"
        footer={
          <div className="btn-group">
            {(detalleModal?.detalle||[]).some(d=>d.pagado==='PENDIENTE') && (
              <Btn variant="primary" icon={CheckCircle} onClick={pagarTodas}>
                Pagar todas las pendientes
              </Btn>
            )}
            <Btn onClick={() => setDetalleModal(null)}>Cerrar</Btn>
          </div>
        }
      >
        {detalleModal && (
          <div>
            <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
              <div style={{ background:'var(--rosa-pale)', padding:'10px 16px', borderRadius:8, fontSize:12 }}>
                <div style={{ color:'var(--text-3)', marginBottom:2 }}>Total</div>
                <strong style={{ fontSize:16, color:'var(--rosa)' }}>${detalleModal.montoTotal}</strong>
              </div>
              <div style={{ background:'#d1fae5', padding:'10px 16px', borderRadius:8, fontSize:12 }}>
                <div style={{ color:'var(--text-3)', marginBottom:2 }}>Pagado</div>
                <strong style={{ fontSize:16, color:'#065f46' }}>${detalleModal.pagado}</strong>
              </div>
              <div style={{ background:'#fde8e8', padding:'10px 16px', borderRadius:8, fontSize:12 }}>
                <div style={{ color:'var(--text-3)', marginBottom:2 }}>Pendiente</div>
                <strong style={{ fontSize:16, color:'#991b1b' }}>${detalleModal.pendiente}</strong>
              </div>
            </div>
            {(detalleModal.detalle||[]).filter(d=>d.pagado==='PENDIENTE').length > 0 && (
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#92400e', fontWeight:600 }}>
                  {(detalleModal.detalle||[]).filter(d=>d.pagado==='PENDIENTE').length} citologias pendientes de pago —
                  ${(detalleModal.detalle||[]).filter(d=>d.pagado==='PENDIENTE').reduce((s,d)=>s+parseFloat(d.precio||0),0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th># Cito</th><th>Paciente</th><th>Fecha</th><th>Precio</th><th>Estado pago</th><th>Acción</th></tr></thead>
                <tbody>
                  {(detalleModal.detalle||[]).map((item,i) => (
                    <tr key={i}>
                      <td style={{ color:'var(--rosa)', fontWeight:600 }}>{item.idCito}</td>
                      <td>{item.nombre}</td>
                      <td style={{ fontSize:11 }}>{item.fecha}</td>
                      <td>${item.precio}</td>
                      <td><PagoPill pago={item.pagado}/></td>
                      <td>
                        {item.pagado === 'PENDIENTE' && (
                          <Btn size="sm" icon={CheckCircle} variant="primary"
                            onClick={() => marcarPagado(item.idCito)}>
                            Marcar pagado
                          </Btn>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
