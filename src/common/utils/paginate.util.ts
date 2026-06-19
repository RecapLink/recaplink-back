import { Paginated, PaginationMeta } from '../types/pagination.type';

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  const meta: PaginationMeta = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
  return { data, meta };
}

export function getPaginationParams(
  page: unknown,
  limit: unknown,
): { skip: number; limit: number; page: number } {
  const p = Math.max(1, parseInt(String(page ?? 1), 10));
  const l = Math.min(100, Math.max(1, parseInt(String(limit ?? 20), 10)));
  return { skip: (p - 1) * l, limit: l, page: p };
}
