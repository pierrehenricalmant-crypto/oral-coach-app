const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // send/receive the httpOnly session cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function teacherLogin(code, password) {
  return request('/api/auth/teacher/login', {
    method: 'POST',
    body: JSON.stringify({ code, password }),
  });
}

export function identifyStudent({ level, teacherCode, firstName, lastInitial }) {
  return request('/api/students/identify', {
    method: 'POST',
    body: JSON.stringify({ level, teacherCode, firstName, lastInitial }),
  });
}

export function getTeacherMe() {
  return request('/api/auth/teacher/me');
}

export function teacherLogout() {
  return request('/api/auth/teacher/logout', { method: 'POST' });
}

export function getUnits(level) {
  return request(`/api/content/${level}/units`);
}

export function createSession(unitId) {
  return request('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ unitId }),
  });
}

export function sendCoachMessage(sessionId, message) {
  return request(`/api/coach/${sessionId}/message`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function endSession(sessionId) {
  return request(`/api/sessions/${sessionId}/end`, { method: 'POST' });
}

export function getDashboard(level) {
  const query = level ? `?level=${encodeURIComponent(level)}` : '';
  return request(`/api/teacher/dashboard${query}`);
}

export function resetStudents(level) {
  return request(`/api/teacher/students?level=${encodeURIComponent(level)}`, { method: 'DELETE' });
}
