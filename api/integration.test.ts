// Live tests against `wrangler dev` (localhost:8787) and the real DATABASE_URL.
// There is no staging DB: each run creates its own records and deletes them in afterAll.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BASE = process.env.API_BASE ?? 'http://localhost:8787';
const TAG = `__itest_${Date.now()}`;

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: (await res.json()) as any };
}

let subId: number;
const extraIds: number[] = [];

beforeAll(async () => {
  const { status, data } = await api('POST', '/api/subcategories', { category: 'work', name: TAG });
  expect(status).toBe(201);
  subId = data.id;
});

afterAll(async () => {
  // One delete: activities go with it via ON DELETE CASCADE.
  for (const id of [subId, ...extraIds]) if (id) await api('DELETE', `/api/subcategories/${id}`);
  const { data } = await api('GET', '/api/board');
  const leftovers = data.flatMap((c: any) => c.subcategories).filter((s: any) => s.name.startsWith(TAG));
  expect(leftovers).toEqual([]);
});

describe('To Do API', () => {
  it('health check reaches the database', async () => {
    expect(await api('GET', '/api/health')).toEqual({ status: 200, data: { ok: true } });
  });

  it('creates an activity, ticks it, and shows it on the board', async () => {
    const created = await api('POST', `/api/subcategories/${subId}/activities`, { title: 'Write tests' });
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject({ title: 'Write tests', done: false });

    const ticked = await api('PATCH', `/api/activities/${created.data.id}`, { done: true });
    expect(ticked.data).toMatchObject({ title: 'Write tests', done: true });

    const { data: board } = await api('GET', '/api/board');
    const sub = board[0].subcategories.find((s: any) => s.id === subId);
    expect(sub.activities).toEqual([{ id: created.data.id, title: 'Write tests', done: true }]);
  });

  it('partial update keeps fields that were not sent', async () => {
    const { data: a } = await api('POST', `/api/subcategories/${subId}/activities`, { title: 'Old' });
    await api('PATCH', `/api/activities/${a.id}`, { done: true });
    const renamed = await api('PATCH', `/api/activities/${a.id}`, { title: 'New' });
    expect(renamed.data).toMatchObject({ title: 'New', done: true });
  });

  it('saves notes without changing the name, and renaming keeps the notes', async () => {
    const notes = 'Call Sam\n- ask about v2';
    const saved = await api('PATCH', `/api/subcategories/${subId}`, { notes });
    expect(saved.data).toMatchObject({ name: TAG, notes });
    const renamed = await api('PATCH', `/api/subcategories/${subId}`, { name: `${TAG} n` });
    expect(renamed.data).toMatchObject({ name: `${TAG} n`, notes });
    const { data: board } = await api('GET', '/api/board');
    expect(board[0].subcategories.find((s: any) => s.id === subId).notes).toBe(notes);
    await api('PATCH', `/api/subcategories/${subId}`, { name: TAG, notes: '' });
  });

  it('renames a subcategory', async () => {
    const res = await api('PATCH', `/api/subcategories/${subId}`, { name: `${TAG} renamed` });
    expect(res.data.name).toBe(`${TAG} renamed`);
  });

  it('reorders sub-categories within a category', async () => {
    const { data: second } = await api('POST', '/api/subcategories', { category: 'work', name: `${TAG} second` });
    extraIds.push(second.id);
    const res = await api('PUT', '/api/subcategories/order', { category: 'work', ids: [second.id, subId] });
    expect(res).toEqual({ status: 200, data: { ok: true } });
    const { data: board } = await api('GET', '/api/board');
    const order = board[0].subcategories.map((s: any) => s.id).filter((id: number) => id === subId || id === second.id);
    expect(order).toEqual([second.id, subId]);
  });

  it('reorders activities within a sub-category', async () => {
    const { data: a } = await api('POST', `/api/subcategories/${subId}/activities`, { title: 'First' });
    const { data: b } = await api('POST', `/api/subcategories/${subId}/activities`, { title: 'Second' });
    const res = await api('PUT', `/api/subcategories/${subId}/activities/order`, { ids: [b.id, a.id] });
    expect(res).toEqual({ status: 200, data: { ok: true } });
    const { data: board } = await api('GET', '/api/board');
    const sub = board[0].subcategories.find((s: any) => s.id === subId);
    const order = sub.activities.map((x: any) => x.id).filter((id: number) => id === a.id || id === b.id);
    expect(order).toEqual([b.id, a.id]);
  });

  it('rejects invalid input with 400 and unknown ids with 404', async () => {
    expect((await api('POST', '/api/subcategories', { category: 'nope', name: 'x' })).status).toBe(400);
    expect((await api('PATCH', '/api/activities/abc', { done: true })).status).toBe(400);
    expect((await api('PATCH', '/api/activities/999999999', { done: true })).status).toBe(404);
    expect((await api('POST', '/api/subcategories/999999999/activities', { title: 'x' })).status).toBe(404);
  });
});
