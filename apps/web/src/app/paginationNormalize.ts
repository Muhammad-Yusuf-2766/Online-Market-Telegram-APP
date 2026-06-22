export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type PageSlice = { page: number; pageSize: number };

/**
 * Ensures RTK Query always receives { items, total, page, pageSize }.
 * Handles legacy array responses and optional { data: PaginatedResult } wrappers.
 */
export function normalizePaginated<T>(response: unknown, slice: PageSlice): PaginatedResult<T> {
  if (Array.isArray(response)) {
    const items = response as T[];
    return {
      items,
      total: items.length,
      page: slice.page,
      pageSize: slice.pageSize,
    };
  }

  if (response === null || typeof response !== 'object') {
    return {
      items: [],
      total: 0,
      page: slice.page,
      pageSize: slice.pageSize,
    };
  }

  const raw = response as Record<string, unknown>;
  const inner = raw.data;
  const innerPaginated =
    inner !== null && typeof inner === 'object'
      ? (inner as { items?: unknown })
      : null;
  const fromData =
    raw.items === undefined &&
    innerPaginated !== null &&
    Array.isArray(innerPaginated.items)
      ? (inner as PaginatedResult<T>)
      : null;

  const src = fromData ?? (raw as unknown as PaginatedResult<T>);

  if (Array.isArray(src.items)) {
    return {
      items: src.items,
      total: typeof src.total === 'number' ? src.total : src.items.length,
      page: typeof src.page === 'number' ? src.page : slice.page,
      pageSize: typeof src.pageSize === 'number' ? src.pageSize : slice.pageSize,
    };
  }

  return {
    items: [],
    total: 0,
    page: slice.page,
    pageSize: slice.pageSize,
  };
}
