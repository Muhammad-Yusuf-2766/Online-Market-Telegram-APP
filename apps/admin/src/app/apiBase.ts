/**
 * Resolve the Parfumbox API base URL for the admin panel.
 *
 * Priority:
 *  1. `VITE_API_BASE_URL` (set in `.env` or as a Docker build ARG on Railway).
 *  2. In dev: same-origin `/_parfumbox-api` (Vite proxy → localhost:3000). Lets the admin UI
 *     be opened over HTTPS (ngrok) without mixed-content failures and forwards Socket.IO too.
 *  3. In prod with no env: same-origin (empty string) — assumes the admin host proxies API
 *     paths through. Cross-origin deployments (Railway) MUST set `VITE_API_BASE_URL` at build.
 */
export function getParfumApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '/_parfumbox-api';
  if (typeof window !== 'undefined') {
    console.warn(
      '[admin apiBase] VITE_API_BASE_URL was not set at build time. Falling back to same-origin requests.',
    );
  }
  return '';
}
