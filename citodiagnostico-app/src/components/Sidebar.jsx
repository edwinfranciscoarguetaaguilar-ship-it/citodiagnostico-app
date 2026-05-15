import { useState } from 'react';
import { LayoutDashboard, ClipboardList, FlaskConical, Activity, FileText, Settings, LogOut, List, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'recepcion',    label: 'Recepción',    icon: ClipboardList },
  { id: 'citologias',   label: 'Citologías',   icon: List },
  { id: 'diagnostico',  label: 'Diagnóstico',  icon: FlaskConical },
  { id: 'inventario',   label: 'Inventario',   icon: Package },
  { id: 'medicos',      label: 'Médicos',      icon: Activity },
  { id: 'facturacion',  label: 'Facturación',  icon: FileText },
  { id: 'config',       label: 'Configuración',icon: Settings },
];

export default function Sidebar({ page, setPage }) {
  const { usuario, logout, puede } = useApp();
  const [col, setCol] = useState(false);

  const paginasPermitidas = {
    dashboard:   true,
    recepcion:   puede('recepcion'),
    citologias:  true,
    diagnostico: puede('diagnostico'),
    inventario:  puede('finanzas'),
    medicos:     puede('medicos'),
    facturacion: puede('finanzas'),
    config:      puede('config'),
  };

  return (
    <aside className="sidebar" style={{ width:col?56:220, minWidth:col?56:220, transition:"width .2s ease", position:"relative", overflow:"hidden" }}>
      <button onClick={()=>setCol(!col)} title={col?"Expandir":"Colapsar"}
        style={{ position:"absolute", right:6, top:10, zIndex:20, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, padding:"4px 6px", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center" }}>
        {col?<ChevronRight size={13}/>:<ChevronLeft size={13}/>}
      </button>
      <div className="sidebar-logo" style={{opacity:col?0:1,transition:"opacity .15s",pointerEvents:col?"none":"auto"}}>
        <div className="sidebar-lab-name">Centro Citodiagnóstico<br/>de la Mujer</div>
        <div className="sidebar-lab-sub">LIS v2.0</div>
      </div>

      <nav className="sidebar-nav">
        {NAV.filter(n => paginasPermitidas[n.id]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-btn ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <Icon size={18}/> {!col && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{opacity:col?0:1,transition:"opacity .15s",pointerEvents:col?"none":"auto"}}>
        <div style={{ marginBottom: 8, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          {usuario?.nombre}
          <span style={{ display:'block', fontSize:10, opacity:.5 }}>{usuario?.rol}</span>
        </div>
        <button
          onClick={logout}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}
        >
          <LogOut size={13}/> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
