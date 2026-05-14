const BASE_URL = process.env.REACT_APP_GAS_URL;

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

export const api = {
  login:              (correo, clave) => apiPost('login', { correo, clave }),
  getDatosIniciales:  () => apiGet('getDatosIniciales'),
  getConfig:          () => apiGet('getConfig'),
  getMedicos:         () => apiGet('getMedicos'),
  getDiagnosticos:    () => apiGet('getDiagnosticos'),
  getCodigos:         () => apiGet('getCodigos'),
  getSiguienteId:     () => apiGet('getSiguienteId'),
  getDashboard:       () => apiGet('getDashboard'),
  getResumenMes:      (mes, anio) => apiGet('getResumenMes', { mes, anio }),
  buscarCitologia:    (id)     => apiGet('buscarCitologia', { id }),
  buscarPorNombre:    (nombre) => apiGet('buscarPorNombre', { nombre }),
  getCitologiasHoy:   () => apiGet('getCitologiasHoy'),
  getCitologiasPendientes: () => apiGet('getCitologiasPendientes'),
  getCitologiasPorFecha: (desde, hasta, medico) => apiGet('getCitologiasPorFecha', { desde, hasta, medico }),
  getCitologiasMedico: (medico) => apiGet('getCitologiasMedico', { medico }),
  registrarLote:      (muestras) => apiPost('registrarLote', { muestras }),
  actualizarCitologia:(data)     => apiPost('actualizarCitologia', data),
  guardarDiagnostico: (data)     => apiPost('guardarDiagnostico', data),
  marcarEnviado:      (idCito)   => apiPost('marcarEnviado', { idCito }),
  actualizarPago:     (idCito, estadoPago) => apiPost('actualizarPago', { idCito, estadoPago }),
  generarPDF:         (idCito)   => apiPost('generarPDF', { idCito }),
  guardarMedico:      (data) => apiPost('guardarMedico', data),
  actualizarMedico:   (data) => apiPost('actualizarMedico', data),
  getEgresos:         (mes, anio) => apiGet('getEgresos', { mes, anio }),
  registrarEgreso:    (data)      => apiPost('registrarEgreso', data),
  actualizarConfig:   (config) => apiPost('actualizarConfig', { config }),
  getResumenInventario:  () => apiGet('getResumenInventario'),
  getHistorialStock:     () => apiGet('getHistorialStock'),
  registrarStockEntrada: (data) => apiPost('registrarStockEntrada', data),
  registrarEntrega:      (data) => apiPost('registrarEntrega', data),
  marcarEntregaPagada:   (id)   => apiPost('marcarEntregaPagada', { id }),
  marcarRetirado:        (id)   => apiPost('marcarRetirado', { id }),
};
