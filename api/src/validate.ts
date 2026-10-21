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

export function parseNewSubcategory(body: unknown): Result<{ category: Category; name: string }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  if (!CATEGORIES.includes(body.category as Category)) {
    return fail(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  const name = text(body.name, 'name', 200);
  if (!name.ok) return name;
  return ok({ category: body.category as Category, name: name.value });
}

/** Partial update: only `name` is editable. */
export function parseSubcategoryUpdate(body: unknown): Result<{ name: string }> {
  if (!isObject(body)) return fail('body must be a JSON object');
  const name = text(body.name, 'name', 200);
  if (!name.ok) return name;
  return ok({ name: name.value });
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
