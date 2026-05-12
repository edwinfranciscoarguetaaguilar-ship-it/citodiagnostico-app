// ─────────────────────────────────────────────────────────────
// API Client — Centro Citodiagnóstico
// Conecta el React con el Google Apps Script desplegado
// GAS requiere no-cors para POST y seguir redirects en GET
// ─────────────────────────────────────────────────────────────

const BASE_URL = '/api';

// Helper GET — GAS responde JSON directo en GET
export async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${BASE_URL}?${query}`, {
    redirect: 'follow',
    method: 'GET',
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Respuesta inválida del servidor. Verificá que el GAS esté desplegado correctamente.');
  }
  if (!json.ok) throw new Error(json.error || 'Error en la API');
  return json.data;
}

// Helper POST — GAS requiere content-type text/plain para evitar preflight CORS
export async function apiPost(action, data = {}) {
  const token = localStorage.getItem('cito_token') || '';
  const res = await fetch(BASE_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data, token }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Respuesta inválida del servidor. Verificá que el GAS esté desplegado correctamente.');
  }
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
  getDashboard: () => apiGet('getDashboard'),

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
  getResumenMes:   (mes, anio) => apiGet('getResumenMes', { mes, anio }),
  getEgresos:      (mes, anio) => apiGet('getEgresos', { mes, anio }),
  registrarEgreso: (data) => apiPost('registrarEgreso', data),

  // Config
  actualizarConfig: (config) => apiPost('actualizarConfig', { config }),
};
