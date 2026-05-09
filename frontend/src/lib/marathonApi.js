const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

function getAdminKey() {
  try {
    return sessionStorage.getItem('backendAdminKey') || '';
  } catch {
    return '';
  }
}

function adminHeaders() {
  const key = getAdminKey();
  return key ? { 'x-admin-key': key } : {};
}

async function apiFetch(path, params = {}, isAdmin = false) {
  const url = new URL(BASE_URL + path);
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') url.searchParams.set(k, v); });
  const res = await fetch(url.toString(), { headers: isAdmin ? adminHeaders() : {} });
  if (!res.ok) throw new Error(`Marathon API ${path} → ${res.status}`);
  return res.json();
}

export function isAdminAuthenticated() {
  return Boolean(getAdminKey());
}

export function saveAdminKey(key) {
  try { sessionStorage.setItem('backendAdminKey', key); } catch {}
}

export function clearAdminKey() {
  try { sessionStorage.removeItem('backendAdminKey'); } catch {}
}

export async function verifyAdminKey(key) {
  try {
    const res = await fetch(`${BASE_URL}/api/debug/auth`, { headers: { 'x-admin-key': key } });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getRatings({ isPublic = true, periodFrom = '', periodTo = '' } = {}) {
  const params = { periodFrom, periodTo };
  if (isPublic) params.public = '1';
  return apiFetch('/api/ratings', params, !isPublic);
}

export async function getErrorMap({ studentName, subject, level, periodFrom = '', periodTo = '' }) {
  return apiFetch('/api/error-map', { studentName, subject, level, periodFrom, periodTo }, true);
}

export async function getStudentDetails({ studentName, subject, level } = {}) {
  return apiFetch('/api/details', { studentName, subject, level }, true);
}

export async function getGroupErrors({ subject, level, teacher, group } = {}) {
  return apiFetch('/api/error-analytics', { subject, level, teacher, group }, true);
}

export async function clearCache() {
  return apiFetch('/api/admin/clear-cache', {}, true);
}

export async function setPenaltyOverride({ studentName, subject, level, penalty } = {}) {
  const res = await fetch(`${BASE_URL}/api/penalty-override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ studentName, subject, level, penalty }),
  });
  if (!res.ok) throw new Error(`Marathon API /api/penalty-override → ${res.status}`);
  return res.json();
}

export async function sendTelegramReport({ studentName, subject, level } = {}) {
  const res = await fetch(`${BASE_URL}/api/telegram/send-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ studentName, subject, level }),
  });
  if (!res.ok) throw new Error(`Marathon API /api/telegram/send-report → ${res.status}`);
  return res.json();
}
