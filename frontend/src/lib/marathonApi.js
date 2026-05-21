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

// Публичный справочник учеников из журнала (включает 10 класс, которого нет в рейтингах).
export async function getStudents() {
  return apiFetch('/api/students', {}, false);
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
  return apiFetch('/api/cache/clear', {}, true);
}

export async function setPenaltyOverride({ name, subject, level, group, teacher, periodFrom, periodTo, penalty, autoPenalty } = {}) {
  const res = await fetch(`${BASE_URL}/api/penalty-override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ name, subject, level, group, teacher, periodFrom, periodTo, penalty, autoPenalty }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Marathon API /api/penalty-override → ${res.status}${detail ? ` ${detail}` : ''}`);
  }
  return res.json();
}

export async function getStudentYear(name, from = '2025-09-01', to = '2026-05-31') {
  return apiFetch('/api/student-year', { name, from, to });
}

export async function getGradesSummary({ periodFrom = '2025-09-01', periodTo = '2026-05-31' } = {}) {
  return apiFetch('/api/grades-summary', { periodFrom, periodTo }, true);
}

export async function getStudentJournal(name, from = '2025-09-01', to = '2026-05-31') {
  return apiFetch('/api/student-journal', { name, from, to });
}

export async function getJournalSummary({ mode = 'students', periodFrom = '2025-09-01', periodTo = '2026-05-31' } = {}) {
  return apiFetch('/api/journal-summary', { mode, periodFrom, periodTo }, true);
}

export async function sendTelegramReport({ studentName, subject, level, format = 'pdf' } = {}) {
  const res = await fetch(`${BASE_URL}/api/telegram/send-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ studentName, subject, level, format }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data.sent && !data.errors) throw new Error(data.error || `Marathon API /api/telegram/send-report → ${res.status}`);
  return data;
}
