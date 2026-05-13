import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import { Toast } from './components/UI';
import { LayoutDashboard, ClipboardList, List, FlaskConical, FileText } from 'lucide-react';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Recepcion    from './pages/Recepcion';
import Citologias   from './pages/Citologias';
import Diagnostico  from './pages/Diagnostico';
import Medicos      from './pages/Medicos';
import Facturacion  from './pages/Facturacion';
import Configuracion from './pages/Configuracion';

const PAGE_TITLES = {
  dashboard:   'Dashboard',
  recepcion:   'Recepción',
  citologias:  'Citologías',
  diagnostico: 'Diagnóstico',
  medicos:     'Médicos',
  facturacion: 'Facturación',
  config:      'Configuración',
};

// Navegación inferior para móvil — solo las 5 más usadas
const BOTTOM_NAV = [
  { id:'dashboard',   label:'Inicio',      icon:LayoutDashboard },
  { id:'recepcion',   label:'Recepción',   icon:ClipboardList },
  { id:'citologias',  label:'Citologías',  icon:List },
  { id:'diagnostico', label:'Diagnóstico', icon:FlaskConical },
  { id:'facturacion', label:'Facturación', icon:FileText },
];

function AppInner() {
  const { usuario } = useApp();
  const [page, setPage] = useState('dashboard');

  if (!usuario) return <Login/>;

  const initials = (usuario.nombre || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage}/>
      <div className="app-main">
        <header className="topbar">
          <span className="topbar-title">{PAGE_TITLES[page]}</span>
          <div className="topbar-right">
            <span className="badge-online">
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#0a6640', display:'inline-block' }}/>
              Sistema en línea
            </span>
            <div className="avatar" title={usuario.nombre}>{initials}</div>
          </div>
        </header>

        <main className="page-body">
          {page === 'dashboard'   && <Dashboard   setPage={setPage}/>}
          {page === 'recepcion'   && <Recepcion/>}
          {page === 'citologias'  && <Citologias/>}
          {page === 'diagnostico' && <Diagnostico/>}
          {page === 'medicos'     && <Medicos/>}
          {page === 'facturacion' && <Facturacion/>}
          {page === 'config'      && <Configuracion/>}
        </main>
      </div>

      {/* Bottom nav — solo visible en móvil */}
      <nav className="bottom-nav no-print">
        <div className="bottom-nav-items">
          {BOTTOM_NAV.map(({ id, label, icon:Icon }) => (
            <button key={id} className={`bottom-nav-btn ${page===id?'active':''}`}
              onClick={() => setPage(id)}>
              <Icon/>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Toast/>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner/>
    </AppProvider>
  );
}
