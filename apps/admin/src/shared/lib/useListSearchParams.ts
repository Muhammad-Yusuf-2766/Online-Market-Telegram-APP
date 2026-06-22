import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PAGE_SIZE_OPTIONS } from './useTablePagination';

const DEFAULT_PAGE = 1;

function parsePage(raw: string | null): number {
  if (raw == null || raw === '') return DEFAULT_PAGE;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE;
  return Math.floor(n);
}

function parsePageSize(raw: string | null, fallback: number): number {
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.min(100, Math.max(1, Math.floor(n)));
  const allowed = PAGE_SIZE_OPTIONS as readonly number[];
  return allowed.includes(clamped) ? clamped : fallback;
}

/**
 * Keeps server-driven list pagination in URL (?page=&pageSize=) so refreshes and back/forward preserve position.
 */
export function useListSearchParams(defaultPageSize: number = 25) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(
    () => parsePage(searchParams.get('page')),
    [searchParams],
  );

  const pageSize = useMemo(
    () => parsePageSize(searchParams.get('pageSize'), defaultPageSize),
    [searchParams, defaultPageSize],
  );

  const setPage = useCallback(
    (next: number) => {
      const p = Math.max(1, Math.floor(next));
      setSearchParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set('page', String(p));
          return out;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPageSize = useCallback(
    (next: number) => {
      const ps = parsePageSize(String(next), defaultPageSize);
      setSearchParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set('pageSize', String(ps));
          out.set('page', '1');
          return out;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaultPageSize],
  );

  return { page, pageSize, setPage, setPageSize };
}
