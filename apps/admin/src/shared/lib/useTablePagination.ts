import { useCallback, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type UseTablePaginationResult<T> = {
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
  pageItems: T[];
};

export function useTablePagination<T>(
  items: readonly T[],
  initialPageSize: (typeof PAGE_SIZE_OPTIONS)[number] = 25,
): UseTablePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const effectivePage = Math.min(page, totalPages);

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPage(1);
  }, []);

  const pageItems = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, effectivePage, pageSize]);

  const rangeStart =
    totalItems === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(effectivePage * pageSize, totalItems);

  return {
    page: effectivePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    rangeStart,
    rangeEnd,
    totalItems,
    pageItems,
  };
}
