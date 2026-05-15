import { useState, useEffect, useCallback } from 'react';
import { Card, Btn, EstatusPill, PagoPill } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

const VISTAS = ['Semana','Mes','3 meses'];

function GraficoTendencias({ datos, vista, setVista }) {
  if (!datos || datos.length === 0) return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>Sin datos para mostrar</div>
  );

  const maxVal = Math.max(...datos.map(d => Math.max(d.recibidas||0, d.realizadas||0)), 1);
  const alto = 160;
  const ancho = 600;
  const padL = 32, padB = 36, padT = 16, padR = 12;
  const w = ancho - padL - padR;
  const h = alto - padT - padB;
  const n = datos.length;
  const barW = Math.max(8, Math.min(32, w / n - 4));
  const gap  = w / n;

  const yPos = (val) => padT + h - (val / maxVal) * h;
  const xPos = (i)   => padL + i * gap + gap/2;

  const linea = (key, color) =>
    datos.map((d,i) => xPos(i)+','+yPos(d[key]||0)).join(' ');

  return (
    <div>
      {/* Toggle vistas */}
      <div style={{ display:'flex', gap:8, padding:'12px 20px 0', justifyContent:'flex-end' }}>
        {VISTAS.map(v=>(
          <button key={v} onClick={()=>setVista(v)}
            style={{ padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid',
              borderColor:vista===v?'var(--rosa)':'var(--border)',
              background:vista===v?'var(--rosa-pale)':'#fff',
              color:vista===v?'var(--rosa)':'var(--text-3)' }}>
            {v}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div style={{ display:'flex', gap:20, padding:'8px 20px', fontSize:11 }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:14, height:3, background:'var(--rosa)', borderRadius:2, display:'inline-block' }}/>
          Recibidas
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:14, height:3, background:'#0a6640', borderRadius:2, display:'inline-block' }}/>
          Realizadas
        </span>
      </div>

      {/* SVG */}
      <div style={{ overflowX:'auto', padding:'0 20px 8px' }}>
        <svg viewBox={`0 0 ${ancho} ${alto}`} style={{ width:'100%', maxWidth:ancho, minWidth:300 }}>
          {/* Lineas guia */}
          {[0,0.25,0.5,0.75,1].map((p,i)=>(
            <g key={i}>
              <line x1={padL} y1={padT+h*p} x2={ancho-padR} y2={padT+h*p}
                stroke="#f0e6ec" strokeWidth="1"/>
              <text x={padL-4} y={padT+h*p+4} fontSize="8" fill="#bbb" textAnchor="end">
                {Math.round(maxVal*(1-p))}
              </text>
            </g>
          ))}

          {/* Barras recibidas */}
          {datos.map((d,i)=>(
            <rect key={'r'+i}
              x={xPos(i)-barW/2-1} y={yPos(d.recibidas||0)}
              width={barW/2} height={h-(yPos(d.recibidas||0)-padT)}
              fill="var(--rosa)" opacity="0.25" rx="2"/>
          ))}

          {/* Barras realizadas */}
          {datos.map((d,i)=>(
            <rect key={'z'+i}
              x={xPos(i)+1} y={yPos(d.realizadas||0)}
              width={barW/2} height={h-(yPos(d.realizadas||0)-padT)}
              fill="#0a6640" opacity="0.2" rx="2"/>
          ))}

          {/* Linea recibidas */}
          <polyline points={linea('recibidas','var(--rosa)')}
            fill="none" stroke="var(--rosa)" strokeWidth="2" strokeLinejoin="round"/>
          {datos.map((d,i)=>(
            <circle key={'cr'+i} cx={xPos(i)} cy={yPos(d.recibidas||0)} r="3"
              fill="var(--rosa)" stroke="#fff" strokeWidth="1.5"/>
          ))}

          {/* Linea realizadas */}
          <polyline points={linea('realizadas','#0a6640')}
            fill="none" stroke="#0a6640" strokeWidth="2" strokeLinejoin="round"/>
          {datos.map((d,i)=>(
            <circle key={'cz'+i} cx={xPos(i)} cy={yPos(d.realizadas||0)} r="3"
              fill="#0a6640" stroke="#fff" strokeWidth="1.5"/>
          ))}

          {/* Etiquetas eje X */}
          {datos.map((d,i)=>(
            <text key={'l'+i} x={xPos(i)} y={alto-padB+16}
              fontSize="8" fill="#888" textAnchor="middle">
              {d.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// Genera datos de tendencia desde array de citologías
function generarTendencia(citos, vista) {
  if (!citos || citos.length === 0) return [];

  const hoy = new Date();
  const puntos = [];

  if (vista === 'Semana') {
    // Excluir domingos (dia 0) — el laboratorio no abre
    let diasAgregados = 0;
    let offset = 0;
    while (diasAgregados < 6) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - offset);
      offset++;
      if (fecha.getDay() === 0) continue; // domingo = 0, saltar
      const key = fecha.toISOString().slice(0,10);
      const label = fecha.toLocaleDateString('es-SV',{ weekday:'short' });
      const dia = citos.filter(c => {
        if (!c.fecha) return false;
        const p = c.fecha.split('/');
        if (p.length !== 3) return false;
        const f = new Date(p[2], p[1]-1, p[0]);
        return f.toISOString().slice(0,10) === key;
      });
      puntos.unshift({
        label,
        recibidas:  dia.length,
        realizadas: dia.filter(c => c.estatus === 'REALIZADO').length
      });
      diasAgregados++;
    }
  } else if (vista === 'Mes') {
    for (let s = 3; s >= 0; s--) {
      const inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - s*7 - 6);
      const fin = new Date(hoy);
      fin.setDate(hoy.getDate() - s*7);
      const semana = citos.filter(c => {
        if (!c.fecha) return false;
        const p = c.fecha.split('/');
        if (p.length !== 3) return false;
        const f = new Date(p[2], p[1]-1, p[0]);
        return f >= inicio && f <= fin;
      });
      puntos.push({
        label: 'S'+(4-s),
        recibidas:  semana.length,
        realizadas: semana.filter(c => c.estatus === 'REALIZADO').length
      });
    }
  } else {
    for (let m = 2; m >= 0; m--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1);
      const mes = citos.filter(c => {
        if (!c.fecha) return false;
        const p = c.fecha.split('/');
        if (p.length !== 3) return false;
        const f = new Date(p[2], p[1]-1, p[0]);
        return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
      });
      puntos.push({
        label: fecha.toLocaleDateString('es-SV',{ month:'short' }),
        recibidas:  mes.length,
        realizadas: mes.filter(c => c.estatus === 'REALIZADO').length
      });
    }
  }
  return puntos;
}

export default function Dashboard({ setPage }) {
  const { mostrarToast } = useApp();
  const [data,    setData]    = useState(null);
  const [citos,   setCitos]   = useState([]);
  const [cargando,setCargando]= useState(true);
  const [filtroMedico, setFiltroMedico] = useState('');
  const [vistaGrafico, setVistaGrafico] = useState('Semana');

  const cargar = useCallback(async (silencioso=false) => {
    if (!silencioso) setCargando(true);
    try {
      // Cargar dashboard y citologías del mes en paralelo
      const hace30 = new Date();
      hace30.setDate(hace30.getDate()-90);
      const desde = hace30.toISOString().slice(0,10);
      const hasta = new Date().toISOString().slice(0,10);

      const [d, c] = await Promise.all([
        api.getDashboard(),
        api.getCitologiasPorFecha(desde, hasta, '')
      ]);
      setData(d);
      setCitos(c || []);
    } catch(e) {
      if (!silencioso) mostrarToast('Error: '+e.message, 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const m = data?.metricas || { totalHoy:0, enProceso:0, realizadasHoy:0, cobrosPendientes:0 };
  const pendientesDX = data?.pendientesDX || [];
  const topMedicos   = (data?.topMedicos || []).filter(med =>
    filtroMedico==='' || med.medico.toLowerCase().includes(filtroMedico.toLowerCase())
  );

  const totalFacturado = topMedicos.reduce((s,med)=>s+(parseFloat(med.monto)||0),0);
  const totalPendiente = topMedicos.reduce((s,med)=>s+(parseFloat(med.pendiente)||0),0);
  const totalCobrado   = totalFacturado - totalPendiente;

  const tendencia = generarTendencia(citos, vistaGrafico);

  return (
    <div className="fade-in">

      {/* METRICAS */}
      <div className="metrics-grid">
        {[
          { label:'Total hoy',         val:cargando?'—':m.totalHoy,            color:'var(--rosa)',  sub:'citologias registradas' },
          { label:'En proceso',        val:cargando?'—':m.enProceso,           color:'#856404',      sub:'pendientes de diagnostico' },
          { label:'Realizadas hoy',    val:cargando?'—':m.realizadasHoy,       color:'#0a6640',      sub:'reportes completados' },
          { label:'Cobros pendientes', val:cargando?'—':'$'+m.cobrosPendientes,color:'#991b1b',      sub:'saldo por cobrar' },
        ].map((card,i)=>(
          <div key={i} className={`metric-card${i===0?' accent':''}`}>
            <div className="metric-label">{card.label}</div>
            <div className="metric-value" style={{ color:i>0?card.color:'' }}>{card.val}</div>
            <div className="metric-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* GRAFICO DE TENDENCIAS */}
      <Card title="Tendencia de citologias"
        action={<Btn size="sm" onClick={()=>cargar()}>Actualizar</Btn>}>
        {cargando && !citos.length
          ? <div style={{ padding:40, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>Cargando...</div>
          : <GraficoTendencias datos={tendencia} vista={vistaGrafico} setVista={setVistaGrafico}/>
        }
      </Card>

      <div className="grid-2">
        {/* Resumen del mes */}
        <Card title="Resumen del mes"
          action={
            <input className="form-input" placeholder="Filtrar medico..." value={filtroMedico}
              onChange={e=>setFiltroMedico(e.target.value)} style={{ width:150, fontSize:12 }}/>
          }>
          <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Total facturado', val:'$'+totalFacturado.toFixed(2), color:'#111' },
              { label:'Cobrado',         val:'$'+totalCobrado.toFixed(2),   color:'#0a6640' },
              { label:'Pendiente',       val:'$'+totalPendiente.toFixed(2), color:'#856404' },
            ].map((r,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color:'var(--text-2)' }}>{r.label}</span>
                <span style={{ fontSize:18, fontWeight:700, color:r.color }}>
                  {cargando?'...':r.val}
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
        <Card title="Pendientes de diagnostico"
          action={<Btn size="sm" onClick={()=>setPage('diagnostico')}>Ir a diagnostico</Btn>}>
          {cargando
            ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13 }}>Cargando...</div>
            : pendientesDX.length===0
              ? <div style={{ padding:20, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>Todo al dia</div>
              : <div className="table-wrap">
                  <table>
                    <thead><tr><th># Cito</th><th>Paciente</th><th>Medico</th><th>Fecha</th></tr></thead>
                    <tbody>
                      {pendientesDX.slice(0,6).map((c,i)=>(
                        <tr key={i}>
                          <td><strong style={{ color:'var(--rosa)' }}>{c.idCito}</strong></td>
                          <td style={{ fontWeight:500 }}>{c.nombre}</td>
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
      <Card title="Top medicos del mes">
        {cargando
          ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13 }}>Cargando...</div>
          : <div className="table-wrap">
              <table>
                <thead><tr><th>Medico</th><th>Citos</th><th>Total</th><th>Pendiente</th></tr></thead>
                <tbody>
                  {topMedicos.map((med,i)=>(
                    <tr key={i}>
                      <td>{med.medico}</td>
                      <td><strong>{med.citos}</strong></td>
                      <td style={{ color:'#0a6640', fontWeight:600 }}>${parseFloat(med.monto||0).toFixed(2)}</td>
                      <td style={{ color:parseFloat(med.pendiente)>0?'#991b1b':'var(--text-3)', fontWeight:parseFloat(med.pendiente)>0?600:400 }}>
                        ${parseFloat(med.pendiente||0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>

      {/* Ultimas */}
      <Card title="Ultimas citologias"
        action={<Btn variant="primary" size="sm" onClick={()=>setPage('recepcion')}>+ Nueva recepcion</Btn>}>
        {cargando
          ? <div style={{ padding:20, color:'var(--text-3)', fontSize:13 }}>Cargando...</div>
          : <div className="table-wrap">
              <table>
                <thead><tr><th># Cito</th><th>Paciente</th><th>Medico</th><th>Muestra</th><th>Pago</th><th>Estatus</th></tr></thead>
                <tbody>
                  {citos.slice(-8).reverse().map((c,i)=>(
                    <tr key={i}>
                      <td><strong style={{ color:'var(--rosa)' }}>{c.idCito}</strong></td>
                      <td style={{ fontWeight:500 }}>{c.nombre}</td>
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
