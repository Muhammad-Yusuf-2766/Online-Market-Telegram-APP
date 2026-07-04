import { getParfumApiBaseUrl } from '../../app/apiBase';

const LOCAL_UPLOAD_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function withApiBase(path: string): string {
  const base = getParfumApiBaseUrl().replace(/\/$/, '');
  return base ? `${base}${path}` : path;
}

export function resolveMediaUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^(data|blob):/i.test(value)) return value;

  try {
    const url = new URL(value);
    if (LOCAL_UPLOAD_HOSTS.has(url.hostname) && url.pathname.startsWith('/uploads/')) {
      return withApiBase(`${url.pathname}${url.search}${url.hash}`);
    }
    return value;
  } catch {
    if (value.startsWith('/uploads/')) return withApiBase(value);
    if (value.startsWith('uploads/')) return withApiBase(`/${value}`);
    return value;
  }
}
