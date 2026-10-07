const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = {
    "content-type": "application/json"
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error ||
        `Request failed (HTTP ${response.status}). Please try again.`
    );
  }

  return result ?? {};
}
