export const API_BASE_URL = 'http://localhost:3000';

export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function apiPost(path, body, includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) Object.assign(headers, authHeaders());
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  return res.json();
}


