import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [usuario, setUsuario]           = useState(null);
  const [token, setToken]               = useState(localStorage.getItem('cito_token') || '');
  const [medicos, setMedicos]           = useState([]);
  const [diagnosticos, setDiagnosticos] = useState({});
  const [codigos, setCodigos]           = useState([]);
  const [config, setConfig]             = useState({});
  const [siguienteId, setSiguienteId]   = useState('');
  const [cargando, setCargando]         = useState(false);
  const [toast, setToast]               = useState(null);

  // Restaurar sesión del localStorage
  useEffect(() => {
    const usr = localStorage.getItem('cito_usuario');
    if (usr && token) {
      try { setUsuario(JSON.parse(usr)); } catch {}
    }
  }, [token]);

  // Cargar datos iniciales cuando hay sesión
  const cargarDatosIniciales = useCallback(async () => {
    if (!token) return;
    try {
      const datos = await api.getDatosIniciales();
      setMedicos(datos.medicos || []);
      setDiagnosticos(datos.diagnosticos || {});
      setCodigos(datos.codigos || []);
      setConfig(datos.config || {});
      setSiguienteId(datos.siguienteId || '');
    } catch (e) {
      console.error('Error cargando datos iniciales:', e);
    }
  }, [token]);

  useEffect(() => {
    if (token) cargarDatosIniciales();
  }, [token, cargarDatosIniciales]);

  const login = async (correo, clave) => {
    setCargando(true);
    try {
      const resultado = await api.login(correo, clave);
      if (resultado.ok) {
        setToken(resultado.token);
        setUsuario(resultado.usuario);
        localStorage.setItem('cito_token', resultado.token);
        localStorage.setItem('cito_usuario', JSON.stringify(resultado.usuario));
        return { ok: true };
      }
      return { ok: false, error: resultado.error };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    setToken('');
    setUsuario(null);
    localStorage.removeItem('cito_token');
    localStorage.removeItem('cito_usuario');
  };

  const mostrarToast = (mensaje, tipo = 'ok') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  // Permisos por rol
  const puede = (accion) => {
    if (!usuario) return false;
    const rol = usuario.rol;
    const permisos = {
      ADMIN:         ['todo'],
      LABORATORISTA: ['recepcion','diagnostico','medicos','finanzas'],
      RECEPCIONISTA: ['recepcion','diagnostico','medicos'],
    };
    const lista = permisos[rol] || [];
    return lista.includes('todo') || lista.includes(accion);
  };

  return (
    <AppContext.Provider value={{
      usuario, token, medicos, diagnosticos, codigos,
      config, siguienteId, setSiguienteId,
      cargando, setCargando, toast,
      login, logout, mostrarToast, puede,
      recargarDatos: cargarDatosIniciales,
      setMedicos, setConfig
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
