import type { PaginationQueryDto } from "./dto/pagination-query.dto";

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function toPaginatedResult<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return { items, total, page, pageSize };
}

type PageSlice = Pick<PaginationQueryDto, "page" | "pageSize">;

/** Normalize clamped page / pageSize from validated query DTO. */
export function paginationParams(query: PageSlice): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
