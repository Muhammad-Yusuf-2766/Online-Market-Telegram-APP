/** Range text + pages for server-driven lists (known total). */
export function paginationFromTotal(
  total: number,
  page: number,
  pageSize: number,
): { totalPages: number; rangeStart: number; rangeEnd: number; effectivePage: number } {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const effectivePage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = total === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(effectivePage * pageSize, total);
  return { totalPages, rangeStart, rangeEnd, effectivePage };
}
