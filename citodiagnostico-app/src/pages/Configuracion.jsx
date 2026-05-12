import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Card, Btn } from '../components/UI';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function Configuracion() {
  const { config, setConfig, mostrarToast } = useApp();
  const [form, setForm]       = useState({ ...config });
  const [guardando, setGuardando] = useState(false);

  const c = (key) => form[key] || '';
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const inp = (key, props={}) => (
    <input className="form-input" value={c(key)} onChange={e => set(key, e.target.value)} {...props}/>
  );

  const guardar = async (seccion) => {
    setGuardando(true);
    try {
      await api.actualizarConfig(form);
      setConfig(form);
      mostrarToast('Configuración guardada correctamente');
    } catch(e) {
      mostrarToast('Error: ' + e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="grid-2">
        {/* Datos del laboratorio */}
        <Card title="Datos del laboratorio" icon={Settings}>
          <div className="form-grid" style={{ padding:20 }}>
            <div className="form-group span2">
              <label className="form-label">Nombre del laboratorio</label>
              {inp('LAB_NOMBRE')}
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono / WhatsApp</label>
              {inp('LAB_TELEFONO')}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              {inp('LAB_EMAIL', { type:'email' })}
            </div>
            <div className="form-group span2">
              <label className="form-label">Dirección completa</label>
              {inp('LAB_DIRECCION')}
            </div>
            <div className="form-group span2">
              <label className="form-label">Slogan</label>
              {inp('LAB_SLOGAN')}
            </div>
            <div className="form-group span2">
              <label className="form-label">URL del logo (Google Drive — imagen pública horizontal)</label>
              {inp('LAB_LOGO_URL', { placeholder:'https://drive.google.com/uc?id=...' })}
              {c('LAB_LOGO_URL') && (
                <img src={c('LAB_LOGO_URL')} alt="Logo preview" style={{ marginTop:8, maxHeight:60, objectFit:'contain' }} onError={e=>e.target.style.display='none'}/>
              )}
            </div>
          </div>
          <div className="form-actions">
            <Btn variant="primary" icon={Save} onClick={guardar} disabled={guardando}>
              {guardando?'Guardando...':'Guardar datos del laboratorio'}
            </Btn>
          </div>
        </Card>

        {/* Datos del citólogo */}
        <Card title="Datos del citólogo" icon={Settings}>
          <div className="form-grid" style={{ padding:20 }}>
            <div className="form-group span2">
              <label className="form-label">Nombre completo del citólogo</label>
              {inp('CITO_NOMBRE')}
            </div>
            <div className="form-group">
              <label className="form-label">Título profesional</label>
              {inp('CITO_TITULO')}
            </div>
            <div className="form-group">
              <label className="form-label">N° de colegiado / Junta</label>
              {inp('CITO_COLEGIADO')}
            </div>
            <div className="form-group span2">
              <label className="form-label">Cargo en el reporte</label>
              {inp('CITO_CARGO')}
            </div>
            <div className="form-group span2">
              <label className="form-label">URL de la firma y sello (imagen en Drive — pública)</label>
              {inp('CITO_FIRMA_URL', { placeholder:'https://drive.google.com/uc?id=...' })}
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>
                Subí la imagen del sello y firma a Google Drive, hacela pública y pegá el link directo aquí.
              </div>
              {c('CITO_FIRMA_URL') && (
                <img src={c('CITO_FIRMA_URL')} alt="Firma preview" style={{ marginTop:8, maxHeight:80, objectFit:'contain' }} onError={e=>e.target.style.display='none'}/>
              )}
            </div>
            <div className="form-group span2">
              <label className="form-label">Nota al pie del reporte</label>
              <textarea className="form-textarea" value={c('REPORTE_NOTA')}
                onChange={e => set('REPORTE_NOTA', e.target.value)} rows={2}/>
            </div>
          </div>
          <div className="form-actions">
            <Btn variant="primary" icon={Save} onClick={guardar} disabled={guardando}>
              {guardando?'Guardando...':'Guardar datos del citólogo'}
            </Btn>
          </div>
        </Card>
      </div>

      {/* Config del sistema */}
      <Card title="Configuración del sistema" icon={Settings}>
        <div className="form-grid" style={{ padding:20 }}>
          <div className="form-group">
            <label className="form-label">ID Carpeta Drive (PDFs)</label>
            {inp('DRIVE_FOLDER_ID')}
            <span style={{ fontSize:10, color:'var(--text-3)' }}>El ID de la carpeta donde se guardan los PDFs generados</span>
          </div>
          <div className="form-group">
            <label className="form-label">Sufijo del año (# cito)</label>
            {inp('CITO_ANO_SUFIJO', { placeholder:'26' })}
            <span style={{ fontSize:10, color:'var(--text-3)' }}>Se usa para formar el ID ej: 3043-26</span>
          </div>
          <div className="form-group">
            <label className="form-label">IVA (%)</label>
            {inp('IVA_PORCENTAJE', { type:'number' })}
          </div>
          <div className="form-group">
            <label className="form-label">Mensaje base WhatsApp</label>
            {inp('WA_MENSAJE_PDF')}
          </div>
        </div>
        <div className="form-actions">
          <Btn variant="primary" icon={Save} onClick={guardar} disabled={guardando}>
            {guardando?'Guardando...':'Guardar configuración'}
          </Btn>
        </div>
      </Card>

      {/* Info usuarios */}
      <Card title="Usuarios del sistema" icon={Settings}>
        <div style={{ padding:'14px 20px', fontSize:13, color:'var(--text-3)' }}>
          Para agregar o modificar usuarios, editá directamente la hoja <strong>USUARIOS</strong> en Google Sheets.
          Los cambios aplican al siguiente inicio de sesión.
          <br/><br/>
          <strong>Roles disponibles:</strong>
          <div style={{ marginTop:8, display:'flex', gap:12, flexWrap:'wrap' }}>
            <span style={{ background:'var(--rosa)', color:'#fff', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600 }}>ADMIN</span>
            <span style={{ background:'var(--rosa-pale)', color:'var(--rosa)', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600 }}>LABORATORISTA</span>
            <span style={{ background:'var(--bg2)', color:'var(--text-3)', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600 }}>RECEPCIONISTA</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
