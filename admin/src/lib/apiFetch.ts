/**
 * Authenticated fetch wrapper for the Pantix admin panel.
 * - Automatically attaches `Authorization: Bearer <token>` header.
 * - On 401/403 responses, clears stale auth data and redirects to /login.
 */
export const TOKEN_KEY = "pantix_admin_token";

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  // Token expired or invalid — clear auth and redirect to login
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("pantix-auth");
    window.location.href = "/login";
  }

  return res;
}
