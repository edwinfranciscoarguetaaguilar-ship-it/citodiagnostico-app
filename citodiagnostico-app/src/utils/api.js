// ─────────────────────────────────────────────────────────────
// API Client — Centro Citodiagnóstico
// Conecta el React con el Google Apps Script desplegado
// ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_GAS_URL;

// Helper GET
export async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${BASE_URL}?${query}`, { redirect: 'follow' });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Respuesta invalida del servidor'); }
  if (!json.ok) throw new Error(json.error || 'Error en la API');
  return json.data;
}

// Helper POST — action va en la URL, payload en query string
export async function apiPost(action, data = {}) {
  const token = localStorage.getItem('cito_token') || '';
  const payload = JSON.stringify({ ...data, _token: token });
  const query = new URLSearchParams({ action, payload }).toString();
  const res = await fetch(`${BASE_URL}?${query}`, { redirect: 'follow' });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Respuesta invalida del servidor'); }
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
  getCitologiasPorFecha:   (desde, hasta, medico) => apiGet('getCitologiasPorFecha', { desde, hasta, medico: medico||'' }),
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

  // Inventario frascos
  getResumenInventario:  () => apiGet('getResumenInventario'),
  getHistorialStock:     () => apiGet('getHistorialStock'),
  registrarStockEntrada: (data) => apiPost('registrarStockEntrada', data),
  registrarEntrega:      (data) => apiPost('registrarEntrega', data),
  marcarEntregaPagada:   (id)   => apiPost('marcarEntregaPagada', { id }),
  marcarRetirado:        (id)   => apiPost('marcarRetirado', { id }),
};
