import { useState, useEffect } from 'react';
import { LayoutDashboard, Clock, BarChart2, ClipboardList, FlaskConical, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, EstatusPill, PagoPill, Spinner, EmptyState, Btn } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function Dashboard({ setPage }) {
  const { mostrarToast } = useApp();
  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState({ desde: '', hasta: '' });
  const [filtroMedico, setFiltroMedico] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e) {
      mostrarToast('Error cargando dashboard: ' + e.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner/></div>
  );

  if (!data) return <EmptyState icon={LayoutDashboard} title="Sin datos" desc="No se pudo cargar el dashboard"/>;

  const { metricas, ultimasCinco, pendientesDX, topMedicos } = data;

  return (
    <div className="fade-in">
      {/* ── MÉTRICAS ── */}
      <div className="metrics-grid">
        <div className="metric-card accent">
          <div className="metric-label">Total hoy</div>
          <div className="metric-value">{metricas.totalHoy}</div>
          <div className="metric-sub">citologías registradas</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">En proceso</div>
          <div className="metric-value" style={{ color:'#856404' }}>{metricas.enProceso}</div>
          <div className="metric-sub">pendientes de diagnóstico</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Realizadas hoy</div>
          <div className="metric-value" style={{ color:'#0a6640' }}>{metricas.realizadasHoy}</div>
          <div className="metric-sub">reportes completados</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cobros pendientes</div>
          <div className="metric-value" style={{ color:'#991b1b' }}>${metricas.cobrosPendientes}</div>
          <div className="metric-sub">saldo por cobrar</div>
        </div>
      </div>

      {/* ── FILTROS ── */}
      <Card title="Filtros de período" icon={BarChart2}
        action={<Btn size="sm" onClick={cargar}>Actualizar</Btn>}
      >
        <div style={{ padding:'14px 20px', display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Desde</label>
            <input type="date" className="form-input" value={filtroFecha.desde}
              onChange={e => setFiltroFecha(f => ({...f, desde:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input type="date" className="form-input" value={filtroFecha.hasta}
              onChange={e => setFiltroFecha(f => ({...f, hasta:e.target.value}))}/>
          </div>
          <div className="form-group" style={{ minWidth:200 }}>
            <label className="form-label">Médico</label>
            <input type="text" className="form-input" placeholder="Filtrar por médico..."
              value={filtroMedico} onChange={e => setFiltroMedico(e.target.value)}/>
          </div>
          <Btn variant="primary" size="sm">Aplicar filtro</Btn>
        </div>
      </Card>

      {/* ── INGRESOS vs GASTOS ── */}
      <div className="grid-2">
        <Card title="Resumen del mes" icon={TrendingUp}>
          <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text-2)' }}>Total facturado</span>
              <span style={{ fontSize:18, fontWeight:700, color:'#111' }}>
                ${topMedicos.reduce((s,m)=>s+(parseFloat(m.monto)||0),0).toFixed(2)}
              </span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text-2)' }}>Cobrado</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#0a6640' }}>
                ${topMedicos.reduce((s,m)=>s+(parseFloat(m.monto)||0)-(parseFloat(m.pendiente)||0),0).toFixed(2)}
              </span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text-2)' }}>Pendiente por cobrar</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#856404' }}>
                ${topMedicos.reduce((s,m)=>s+(parseFloat(m.pendiente)||0),0).toFixed(2)}
              </span>
            </div>
            <div style={{ height:1, background:'var(--border)' }}/>
            <div className="btn-group">
              <Btn size="sm" onClick={() => setPage('facturacion')}>Ver facturación →</Btn>
              <Btn size="sm" onClick={() => setPage('citologias')}>Ver citologías →</Btn>
            </div>
          </div>
        </Card>

        <Card title="Pendientes de diagnóstico" icon={Clock}
          action={<Btn size="sm" onClick={() => setPage('citologias')}>Ver en Citologías →</Btn>}
        >
          {pendientesDX.length === 0
            ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13, textAlign:'center' }}>✅ Todo al día</div>
            : <div className="table-wrap">
                <table>
                  <thead><tr><th># Cito</th><th>Paciente</th><th>Médico</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {pendientesDX.slice(0,6).map((c,i) => (
                      <tr key={i}>
                        <td><strong style={{ color:'var(--rosa)' }}>{c.idCito}</strong></td>
                        <td>{c.nombre}</td>
                        <td style={{ fontSize:11 }}>{c.medico}</td>
                        <td style={{ fontSize:11 }}>{c.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </Card>
      </div>

      {/* ── TOP MÉDICOS ── */}
      <Card title="Top médicos del mes" icon={BarChart2}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Médico</th><th>Citos</th><th>Total</th><th>Pendiente</th></tr></thead>
            <tbody>
              {topMedicos.map((m,i) => (
                <tr key={i}>
                  <td>{m.medico}</td>
                  <td><strong>{m.citos}</strong></td>
                  <td style={{ color:'#0a6640', fontWeight:600 }}>${m.monto.toFixed(2)}</td>
                  <td style={{ color: m.pendiente>0?'#991b1b':'var(--text-3)', fontWeight: m.pendiente>0?600:400 }}>
                    ${m.pendiente.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── ÚLTIMAS CITOLOGÍAS ── */}
      <Card
        title="Últimas citologías registradas" icon={ClipboardList}
        action={<Btn variant="primary" size="sm" onClick={() => setPage('recepcion')}>+ Nueva recepción</Btn>}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th># Cito</th><th>Paciente</th><th>Edad</th><th>Médico</th><th>Muestra</th><th>Pago</th><th>Estatus</th><th></th></tr>
            </thead>
            <tbody>
              {ultimasCinco.map((c,i) => (
                <tr key={i}>
                  <td><strong style={{ color:'var(--rosa)' }}>{c.idCito}</strong></td>
                  <td style={{ fontWeight:500 }}>{c.nombre}</td>
                  <td>{c.edad}</td>
                  <td style={{ fontSize:11 }}>{c.medico}</td>
                  <td style={{ fontSize:11 }}>{c.muestra}</td>
                  <td><PagoPill pago={c.pagado}/></td>
                  <td><EstatusPill estatus={c.estatus}/></td>
                  <td>
                    {c.estatus === 'EN PROCESO'
                      ? <Btn size="sm icon" icon={FlaskConical} onClick={() => setPage('diagnostico')}/>
                      : c.urlPDF && <a href={c.urlPDF} target="_blank" rel="noreferrer" className="btn btn-sm">PDF</a>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
