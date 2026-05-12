import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import { Toast } from './components/UI';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Recepcion    from './pages/Recepcion';
import Diagnostico  from './pages/Diagnostico';
import Medicos      from './pages/Medicos';
import Facturacion  from './pages/Facturacion';
import Configuracion from './pages/Configuracion';

const PAGE_TITLES = {
  dashboard:   'Dashboard',
  recepcion:   'Recepción — Registro de citologías',
  diagnostico: 'Diagnóstico — Generar reporte',
  medicos:     'Médicos y laboratorios',
  facturacion: 'Facturación',
  config:      'Configuración del sistema',
};

function AppInner() {
  const { usuario } = useApp();
  const [page, setPage] = useState('dashboard');

  if (!usuario) return <Login/>;

  const initials = (usuario.nombre || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage}/>
      <div className="app-main">
        {/* Topbar */}
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

        {/* Contenido */}
        <main className="page-body">
          {page === 'dashboard'   && <Dashboard   setPage={setPage}/>}
          {page === 'recepcion'   && <Recepcion/>}
          {page === 'diagnostico' && <Diagnostico/>}
          {page === 'medicos'     && <Medicos/>}
          {page === 'facturacion' && <Facturacion/>}
          {page === 'config'      && <Configuracion/>}
        </main>
      </div>

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
