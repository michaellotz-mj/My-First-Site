import type { Activity, CategoryBoard, CategoryKey, Subcategory, Urgency } from './types';

/**
 * API base URL. Set VITE_API_URL at build time for production
 * (e.g. in frontend/.env.production — not a secret). Defaults to local `wrangler dev`.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  board: () => request<CategoryBoard[]>('GET', '/api/board'),
  createSubcategory: (category: CategoryKey, name: string, today = false) =>
    request<Subcategory>('POST', '/api/subcategories', { category, name, today }),
  updateSubcategory: (id: number, changes: { name?: string; notes?: string; today?: boolean; urgency?: Urgency }) =>
    request<Subcategory>('PATCH', `/api/subcategories/${id}`, changes),
  reorderToday: (ids: number[]) => request<{ ok: true }>('PUT', '/api/today/order', { ids }),
  reorderSubcategories: (category: CategoryKey, ids: number[]) =>
    request<{ ok: true }>('PUT', '/api/subcategories/order', { category, ids }),
  deleteSubcategory: (id: number) => request<{ ok: true }>('DELETE', `/api/subcategories/${id}`),
  createActivity: (subcategoryId: number, title: string) =>
    request<Activity>('POST', `/api/subcategories/${subcategoryId}/activities`, { title }),
  reorderActivities: (subcategoryId: number, ids: number[]) =>
    request<{ ok: true }>('PUT', `/api/subcategories/${subcategoryId}/activities/order`, { ids }),
  updateActivity: (id: number, changes: { title?: string; done?: boolean }) =>
    request<Activity>('PATCH', `/api/activities/${id}`, changes),
  deleteActivity: (id: number) => request<{ ok: true }>('DELETE', `/api/activities/${id}`),
};
