// Pure input validation — no I/O, unit-tested in validate.test.ts.

export const CATEGORIES = ['work', 'business', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(error: string): Result<T> => ({ ok: false, error });

function isObject(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

/** Trims and length-checks a required text field. */
function text(value: unknown, field: string, max: number): Result<string> {
  if (typeof value !== 'string') return fail(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length === 0) return fail(`${field} is required`);
  if (trimmed.length > max) return fail(`${field} must be at most ${max} characters`);
  return ok(trimmed);
}

export function parseId(raw: string): Result<number> {
  if (!/^\d{1,9}$/.test(raw)) return fail('invalid id');
  const id = Number(raw);
  return id > 0 ? ok(id) : fail('invalid id');
}

/** `today` is optional: true also puts the new sub-category on the Today list. */
export function parseNewSubcategory(body: unknown): Result<{ category: Category; name: string; today: boolean }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  if (!CATEGORIES.includes(body.category as Category)) {
    return fail(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  const name = text(body.name, 'name', 200);
  if (!name.ok) return name;
  if (body.today !== undefined && typeof body.today !== 'boolean') return fail('today must be a boolean');
  return ok({ category: body.category as Category, name: name.value, today: body.today === true });
}

export const MAX_NOTES = 10000;
export const URGENCIES = [1, 2, 3] as const;
export type Urgency = (typeof URGENCIES)[number];

/**
 * Partial update: send any of `name`, `notes`, `today`, `urgency`. Omitted fields come back as null
 * so the SQL can COALESCE them. Notes may be empty (clears them) and keep their whitespace and line breaks.
 */
export function parseSubcategoryUpdate(
  body: unknown,
): Result<{ name: string | null; notes: string | null; today: boolean | null; urgency: Urgency | null }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  let name: string | null = null;
  let notes: string | null = null;
  let today: boolean | null = null;
  let urgency: Urgency | null = null;
  if (body.name !== undefined) {
    const n = text(body.name, 'name', 200);
    if (!n.ok) return n;
    name = n.value;
  }
  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') return fail('notes must be a string');
    if (body.notes.length > MAX_NOTES) return fail(`notes must be at most ${MAX_NOTES} characters`);
    notes = body.notes;
  }
  if (body.today !== undefined) {
    if (typeof body.today !== 'boolean') return fail('today must be a boolean');
    today = body.today;
  }
  if (body.urgency !== undefined) {
    if (!URGENCIES.includes(body.urgency as Urgency)) return fail('urgency must be 1, 2 or 3');
    urgency = body.urgency as Urgency;
  }
  if (name === null && notes === null && today === null && urgency === null) {
    return fail('send at least one of: name, notes, today, urgency');
  }
  return ok({ name, notes, today, urgency });
}

/** A non-empty list of unique positive ids, top first. */
function idList(value: unknown): Result<number[]> {
  if (!Array.isArray(value) || value.length === 0) return fail('ids must be a non-empty array');
  if (value.length > 1000) return fail('ids must have at most 1000 entries');
  if (!value.every((id) => Number.isInteger(id) && id > 0 && id < 1e9)) return fail('ids must be positive integers');
  if (new Set(value).size !== value.length) return fail('ids must not repeat');
  return ok(value as number[]);
}

/** Full new order of a category's sub-categories, top first. */
export function parseReorder(body: unknown): Result<{ category: Category; ids: number[] }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  if (!CATEGORIES.includes(body.category as Category)) {
    return fail(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  const ids = idList(body.ids);
  if (!ids.ok) return ids;
  return ok({ category: body.category as Category, ids: ids.value });
}

/**
 * Cut-off for the morning clear-out: an ISO timestamp (the client's local midnight).
 * Must be within a week of now, so a bad clock or stale tab can't clear much.
 */
export function parseClearBefore(body: unknown, now = Date.now()): Result<{ before: string }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  if (typeof body.before !== 'string') return fail('before must be an ISO timestamp');
  const time = Date.parse(body.before);
  if (Number.isNaN(time)) return fail('before must be an ISO timestamp');
  if (Math.abs(time - now) > 7 * 24 * 60 * 60 * 1000) return fail('before must be within a week of now');
  return ok({ before: new Date(time).toISOString() });
}

/** Full new order of the Today list, top first. */
export function parseTodayReorder(body: unknown): Result<{ ids: number[] }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  const ids = idList(body.ids);
  if (!ids.ok) return ids;
  return ok({ ids: ids.value });
}

/** Full new order of one sub-category's activities, top first. */
export function parseActivityReorder(body: unknown): Result<{ ids: number[] }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  const ids = idList(body.ids);
  if (!ids.ok) return ids;
  return ok({ ids: ids.value });
}

export function parseNewActivity(body: unknown): Result<{ title: string }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  const title = text(body.title, 'title', 500);
  if (!title.ok) return title;
  return ok({ title: title.value });
}

/**
 * Partial update: send `title`, `done`, or both. Omitted fields are left unchanged
 * (returned as null so the SQL can COALESCE — Neon rejects `undefined` params).
 */
export function parseActivityUpdate(body: unknown): Result<{ title: string | null; done: boolean | null }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  let title: string | null = null;
  let done: boolean | null = null;
  if (body.title !== undefined) {
    const t = text(body.title, 'title', 500);
    if (!t.ok) return t;
    title = t.value;
  }
  if (body.done !== undefined) {
    if (typeof body.done !== 'boolean') return fail('done must be a boolean');
    done = body.done;
  }
  if (title === null && done === null) return fail('send at least one of: title, done');
  return ok({ title, done });
}
