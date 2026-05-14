import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Clock, BarChart2, ClipboardList } from 'lucide-react';
import { Card, EstatusPill, PagoPill, Btn } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function Dashboard({ setPage }) {
  const { mostrarToast } = useApp();
  const [data, setData]           = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [filtroMedico, setFiltroMedico] = useState('');

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e) {
      if (!silencioso) mostrarToast('Error cargando dashboard: ' + e.message, 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar al montar — silencioso para no bloquear UI
  useEffect(() => { cargar(); }, [cargar]);

  const metricas = data?.metricas || { totalHoy:0, enProceso:0, realizadasHoy:0, cobrosPendientes:0 };
  const ultimasCinco = data?.ultimasCinco || [];
  const pendientesDX = data?.pendientesDX || [];
  const topMedicos   = (data?.topMedicos   || []).filter(m =>
    filtroMedico === '' || m.medico.toLowerCase().includes(filtroMedico.toLowerCase())
  );

  const totalFacturado  = topMedicos.reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
  const totalPendiente  = topMedicos.reduce((s,m)=>s+(parseFloat(m.pendiente)||0),0);
  const totalCobrado    = totalFacturado - totalPendiente;

  return (
    <div className="fade-in">

      {/* METRICAS */}
      <div className="metrics-grid">
        <div className="metric-card accent">
          <div className="metric-label">Total hoy</div>
          <div className="metric-value">{cargando ? '—' : metricas.totalHoy}</div>
          <div className="metric-sub">citologias registradas</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">En proceso</div>
          <div className="metric-value" style={{ color:'#856404' }}>{cargando ? '—' : metricas.enProceso}</div>
          <div className="metric-sub">pendientes de diagnostico</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Realizadas hoy</div>
          <div className="metric-value" style={{ color:'#0a6640' }}>{cargando ? '—' : metricas.realizadasHoy}</div>
          <div className="metric-sub">reportes completados</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cobros pendientes</div>
          <div className="metric-value" style={{ color:'#991b1b' }}>{cargando ? '—' : '$'+metricas.cobrosPendientes}</div>
          <div className="metric-sub">saldo por cobrar</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Resumen del mes */}
        <Card title="Resumen del mes" icon={BarChart2}
          action={
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input className="form-input" placeholder="Filtrar medico..." value={filtroMedico}
                onChange={e=>setFiltroMedico(e.target.value)} style={{ width:160, fontSize:12 }}/>
              <Btn size="sm" onClick={()=>cargar()}>Actualizar</Btn>
            </div>
          }>
          <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Total facturado', val:'$'+totalFacturado.toFixed(2), color:'#111' },
              { label:'Cobrado',         val:'$'+totalCobrado.toFixed(2),   color:'#0a6640' },
              { label:'Pendiente',       val:'$'+totalPendiente.toFixed(2), color:'#856404' },
            ].map((r,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color:'var(--text-2)' }}>{r.label}</span>
                <span style={{ fontSize:18, fontWeight:700, color:r.color }}>
                  {cargando ? '...' : r.val}
                </span>
              </div>
            ))}
            <div style={{ height:1, background:'var(--border)' }}/>
            <div className="btn-group">
              <Btn size="sm" onClick={()=>setPage('facturacion')}>Ver facturacion</Btn>
              <Btn size="sm" onClick={()=>setPage('citologias')}>Ver citologias</Btn>
            </div>
          </div>
        </Card>

        {/* Pendientes */}
        <Card title="Pendientes de diagnostico" icon={Clock}
          action={<Btn size="sm" onClick={()=>setPage('citologias')}>Ver en Citologias</Btn>}>
          {cargando
            ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13 }}>Cargando...</div>
            : pendientesDX.length === 0
              ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13, textAlign:'center' }}>Todo al dia</div>
              : <div className="table-wrap">
                  <table>
                    <thead><tr><th># Cito</th><th>Paciente</th><th>Medico</th><th>Fecha</th></tr></thead>
                    <tbody>
                      {pendientesDX.slice(0,6).map((c,i)=>(
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

      {/* Top medicos */}
      <Card title="Top medicos del mes" icon={BarChart2}>
        {cargando
          ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13 }}>Cargando...</div>
          : <div className="table-wrap">
              <table>
                <thead><tr><th>Medico</th><th>Citos</th><th>Total</th><th>Pendiente</th></tr></thead>
                <tbody>
                  {topMedicos.map((m,i)=>(
                    <tr key={i}>
                      <td>{m.medico}</td>
                      <td><strong>{m.citos}</strong></td>
                      <td style={{ color:'#0a6640', fontWeight:600 }}>${parseFloat(m.monto||0).toFixed(2)}</td>
                      <td style={{ color: parseFloat(m.pendiente)>0?'#991b1b':'var(--text-3)', fontWeight: parseFloat(m.pendiente)>0?600:400 }}>
                        ${parseFloat(m.pendiente||0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>

      {/* Ultimas citologias */}
      <Card title="Ultimas citologias registradas" icon={ClipboardList}
        action={<Btn variant="primary" size="sm" onClick={()=>setPage('recepcion')}>+ Nueva recepcion</Btn>}>
        {cargando
          ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13 }}>Cargando...</div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr><th># Cito</th><th>Paciente</th><th>Edad</th><th>Medico</th><th>Muestra</th><th>Pago</th><th>Estatus</th></tr>
                </thead>
                <tbody>
                  {ultimasCinco.map((c,i)=>(
                    <tr key={i}>
                      <td><strong style={{ color:'var(--rosa)' }}>{c.idCito}</strong></td>
                      <td style={{ fontWeight:500 }}>{c.nombre}</td>
                      <td>{c.edad}</td>
                      <td style={{ fontSize:11 }}>{c.medico}</td>
                      <td style={{ fontSize:11 }}>{c.muestra}</td>
                      <td><PagoPill pago={c.pagado}/></td>
                      <td><EstatusPill estatus={c.estatus}/></td>
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
