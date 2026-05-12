// ─────────────────────────────────────────────────────────────
// API Client — Centro Citodiagnóstico
// Conecta el React con el Google Apps Script desplegado
// ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_GAS_URL;

// Helper GET
export async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${BASE_URL}?${query}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Error en la API');
  return json.data;
}

// Helper POST
export async function apiPost(action, data = {}) {
  const token = localStorage.getItem('cito_token') || '';
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, data, token }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Error en la API');
  return json.data;
}

// ── Endpoints ─────────────────────────────────────────────────

export const api = {
  // Auth
  login: (correo, clave) => apiPost('login', { correo, clave }),

  // Datos iniciales (médicos, catálogos, config)
  getDatosIniciales: () => apiGet('getDatosIniciales'),
  getConfig:         () => apiGet('getConfig'),
  getMedicos:        () => apiGet('getMedicos'),
  getDiagnosticos:   () => apiGet('getDiagnosticos'),
  getCodigos:        () => apiGet('getCodigos'),
  getSiguienteId:    () => apiGet('getSiguienteId'),

  // Dashboard
  getDashboard:      () => apiGet('getDashboard'),

  // Citologías
  getCitologiasHoy:        () => apiGet('getCitologiasHoy'),
  getCitologiasPendientes: () => apiGet('getCitologiasPendientes'),
  buscarCitologia:  (id)   => apiGet('buscarCitologia', { id }),
  registrarLote:    (muestras) => apiPost('registrarLote', { muestras }),
  actualizarCitologia: (data)  => apiPost('actualizarCitologia', data),
  actualizarPago:   (idCito, estadoPago) => apiPost('actualizarPago', { idCito, estadoPago }),
  marcarEnviado:    (idCito) => apiPost('marcarEnviado', { idCito }),

  // Diagnóstico
  guardarDiagnostico: (data) => apiPost('guardarDiagnostico', data),
  generarPDF:         (idCito) => apiPost('generarPDF', { idCito }),
  getReportePDF:      (id) => apiGet('getReportePDF', { id }),

  // Médicos
  guardarMedico:    (data) => apiPost('guardarMedico', data),
  actualizarMedico: (data) => apiPost('actualizarMedico', data),

  // Finanzas
  getResumenMes: (mes, anio) => apiGet('getResumenMes', { mes, anio }),
  getEgresos:    (mes, anio) => apiGet('getEgresos', { mes, anio }),
  registrarEgreso: (data) => apiPost('registrarEgreso', data),

  // Config
  actualizarConfig: (config) => apiPost('actualizarConfig', { config }),
};
