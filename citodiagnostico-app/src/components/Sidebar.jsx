import { LayoutDashboard, ClipboardPlus, Microscope, Stethoscope, FileText, Settings, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'recepcion',    label: 'Recepción',    icon: ClipboardPlus },
  { id: 'diagnostico',  label: 'Diagnóstico',  icon: Microscope },
  { id: 'medicos',      label: 'Médicos',      icon: Stethoscope },
  { id: 'facturacion',  label: 'Facturación',  icon: FileText },
  { id: 'config',       label: 'Configuración',icon: Settings },
];

export default function Sidebar({ page, setPage }) {
  const { usuario, logout, puede } = useApp();

  const paginasPermitidas = {
    dashboard:   true,
    recepcion:   puede('recepcion'),
    diagnostico: puede('diagnostico'),
    medicos:     puede('medicos'),
    facturacion: puede('finanzas'),
    config:      puede('config'),
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
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
            <Icon size={18}/> {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
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
