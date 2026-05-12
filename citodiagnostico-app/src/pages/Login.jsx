import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login, cargando } = useApp();
  const [correo, setCorreo] = useState('');
  const [clave,  setClave]  = useState('');
  const [error,  setError]  = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const res = await login(correo, clave);
    if (!res.ok) setError(res.error || 'Credenciales incorrectas');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>Centro Citodiagnóstico<br/>de la Mujer</h1>
          <p>Sistema de Gestión — LIS v2.0</p>
        </div>
        <div className="login-divider"/>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="form-input"
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              value={clave}
              onChange={e => setClave(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 12px', color:'#991b1b', fontSize:12 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={cargando}
            style={{ width:'100%', padding:'11px', fontSize:13, marginTop:4, justifyContent:'center' }}
          >
            {cargando ? 'Iniciando sesión...' : 'Ingresar al sistema'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:11, color:'#9a7080' }}>
          Centro Citodiagnóstico de la Mujer · San Miguel, El Salvador
        </p>
      </div>
    </div>
  );
}
