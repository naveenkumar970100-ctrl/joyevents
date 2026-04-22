// Resolve the backend API base URL.
//
// Priority:
//  1. VITE_API_URL build-time env var  →  use as-is (always wins)
//  2. Running on localhost             →  use localhost:5001 (local dev)
//  3. Running on a non-localhost host  →  use same host on port 5001
//     (PM2 separate deploy: frontend :8080, backend :5001, same server IP)
//
// For production with Nginx proxying /api → backend on same domain,
// set VITE_API_URL to your domain (e.g. https://yourdomain.com) at build time.

const envUrl: string = (import.meta as any).env?.VITE_API_URL || "";

function resolveApiUrl(): string {
  // If an explicit URL was provided at build time, always use it
  if (envUrl) return envUrl;

  try {
    const { protocol, hostname } = window.location;
    // Local dev: backend on localhost:5001
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5001";
    }
    // PM2 separate deploy on same server: frontend on :8080, backend on :5001
    // Use the same hostname but point to the backend port
    return `${protocol}//${hostname}:5001`;
  } catch {
    return "http://localhost:5001";
  }
}

export const API_URL = resolveApiUrl();
