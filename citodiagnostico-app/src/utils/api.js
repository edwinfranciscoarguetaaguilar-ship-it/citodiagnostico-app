const BASE_URL = 'https://script.google.com/macros/s/AKfycbzLGvHKoMCCSZ3Ae55exIZaoxtAHIWH9ihizmH9l-DEISgxpDbIP0ZdVEdqZhYbypv4/exec';

// GAS solo acepta GET con CORS — enviamos todo por GET incluyendo el POST
export async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${BASE_URL}?${query}`, { redirect: 'follow' });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!json.ok) throw new Error(json.error || 'Error en la API');
    return json.data;
  } catch {
    throw new Error('Respuesta inválida del servidor');
  }
}

// Para POST usamos GET con el body serializado en un parámetro
export async function apiPost(action, data = {}) {
  const token = localStorage.getItem('cito_token') || '';
  const payload = JSON.stringify({ ...data, _token: token });
  const query = new URLSearchParams({ action, payload }).toString();
  const res = await fetch(`${BASE_URL}?${query}`, { redirect: 'follow' });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!json.ok) throw new Error(json.error || 'Error en la API');
    return json.data;
  } catch {
    throw new Error('Respuesta inválida del servidor');
  }
}

export const api = {
  login: (correo, clave) => apiPost('login', { correo, clave }),
  getDatosIniciales: () => apiGet('getDatosIniciales'),
  getConfig:         () => apiGet('getConfig'),
  getMedicos:        () => apiGet('getMedicos'),
  getDiagnosticos:   () => apiGet('getDiagnosticos'),
  getCodigos:        () => apiGet('getCodigos'),
  getSiguienteId:    () => apiGet('getSiguienteId'),
  getDashboard:      () => apiGet('getDashboard'),
  getCitologiasHoy:        () => apiGet('getCitologiasHoy'),
  getCitologiasPendientes: () => apiGet('getCitologiasPendientes'),
  buscarCitologia:  (id)   => apiGet('buscarCitologia', { id }),
  registrarLote:    (muestras) => apiPost('registrarLote', { muestras }),
  actualizarCitologia: (data)  => apiPost('actualizarCitologia', data),
  actualizarPago:   (idCito, estadoPago) => apiPost('actualizarPago', { idCito, estadoPago }),
  marcarEnviado:    (idCito) => apiPost('marcarEnviado', { idCito }),
  guardarDiagnostico: (data) => apiPost('guardarDiagnostico', data),
  generarPDF:         (idCito) => apiPost('generarPDF', { idCito }),
  getReportePDF:      (id) => apiGet('getReportePDF', { id }),
  guardarMedico:    (data) => apiPost('guardarMedico', data),
  actualizarMedico: (data) => apiPost('actualizarMedico', data),
  getResumenMes:   (mes, anio) => apiGet('getResumenMes', { mes, anio }),
  getEgresos:      (mes, anio) => apiGet('getEgresos', { mes, anio }),
  registrarEgreso: (data) => apiPost('registrarEgreso', data),
  actualizarConfig: (config) => apiPost('actualizarConfig', { config }),
};
