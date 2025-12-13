// src/utils/api.js
export async function apiGet(path, token) {
  // Use import.meta.env for Vite environment variables.
  // The 'process' object is not available in browser environments with Vite.
  // VITE_API_BASE should be defined in your .env file (e.g., .env.local)
  // Example: VITE_API_BASE=http://localhost:5000
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  // Prepend '/api' to the path to match the backend routes
  const fullPath = `/api${path}`;

  const res = await fetch(`${apiBaseUrl}${fullPath}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) {
    // Attempt to parse JSON error message, fallback to statusText
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "API error");
  }
  return res.json();
}
