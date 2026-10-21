import { neon } from '@neondatabase/serverless';
import { buildBoard, type ActivityRow, type SubcategoryRow } from './board';
import { redactSecrets } from './redact';
import {
  parseActivityUpdate,
  parseId,
  parseNewActivity,
  parseNewSubcategory,
  parseReorder,
  parseSubcategoryUpdate,
  type Result,
} from './validate';

export interface Env {
  DATABASE_URL: string;
  /** Comma-separated extra allowed origins (e.g. the deployed frontend URL). */
  ALLOWED_ORIGINS?: string;
}

type Sql = ReturnType<typeof neon<false, false>>;
type Handler = (ctx: { sql: Sql; params: string[]; body: unknown }) => Promise<Response>;

const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function isAllowedOrigin(origin: string | null, allowed: string | undefined): boolean {
  if (!origin) return false;
  if (LOCALHOST_ORIGIN.test(origin)) return true;
  return (allowed ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .includes(origin);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const badRequest = (error: string) => json({ error }, 400);
const notFound = () => json({ error: 'not found' }, 404);

/** Runs a handler only if validation passed; otherwise returns 400. */
function validated<T>(result: Result<T>, run: (value: T) => Promise<Response>): Promise<Response> {
  return result.ok ? run(result.value) : Promise.resolve(badRequest(result.error));
}

const routes: { method: string; pattern: RegExp; handler: Handler }[] = [
  {
    method: 'GET',
    pattern: /^\/api\/health$/,
    handler: async ({ sql }) => {
      await sql`SELECT 1`;
      return json({ ok: true });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/board$/,
    handler: async ({ sql }) => {
      const [subs, acts] = await Promise.all([
        sql`SELECT id, category, name, position FROM subcategories`,
        sql`SELECT id, subcategory_id, title, done, position FROM activities`,
      ]);
      return json(buildBoard(subs as SubcategoryRow[], acts as ActivityRow[]));
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/subcategories$/,
    handler: ({ sql, body }) =>
      validated(parseNewSubcategory(body), async ({ category, name }) => {
        const rows = await sql`
          INSERT INTO subcategories (category, name, position)
          VALUES (${category}, ${name},
            (SELECT COALESCE(MAX(position), 0) + 1 FROM subcategories WHERE category = ${category}))
          RETURNING id, category, name`;
        return json({ ...rows[0], activities: [] }, 201);
      }),
  },
  {
    method: 'PUT',
    pattern: /^\/api\/subcategories\/order$/,
    handler: ({ sql, body }) =>
      validated(parseReorder(body), async ({ category, ids }) => {
        // Position = index in the list. Ids from another category are ignored.
        await sql`
          UPDATE subcategories s SET position = o.ord
          FROM unnest(${ids}::int[]) WITH ORDINALITY AS o(id, ord)
          WHERE s.id = o.id AND s.category = ${category}`;
        return json({ ok: true });
      }),
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/subcategories\/(\w+)$/,
    handler: ({ sql, params, body }) =>
      validated(parseId(params[0]), (id) =>
        validated(parseSubcategoryUpdate(body), async ({ name }) => {
          const rows = await sql`
            UPDATE subcategories SET name = ${name} WHERE id = ${id}
            RETURNING id, category, name`;
          return rows.length ? json(rows[0]) : notFound();
        }),
      ),
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/subcategories\/(\w+)$/,
    handler: ({ sql, params }) =>
      validated(parseId(params[0]), async (id) => {
        // Activities are removed by ON DELETE CASCADE.
        const rows = await sql`DELETE FROM subcategories WHERE id = ${id} RETURNING id`;
        return rows.length ? json({ ok: true }) : notFound();
      }),
  },
  {
    method: 'POST',
    pattern: /^\/api\/subcategories\/(\w+)\/activities$/,
    handler: ({ sql, params, body }) =>
      validated(parseId(params[0]), (subcategoryId) =>
        validated(parseNewActivity(body), async ({ title }) => {
          const rows = await sql`
            INSERT INTO activities (subcategory_id, title, position)
            SELECT s.id, ${title},
              (SELECT COALESCE(MAX(position), 0) + 1 FROM activities WHERE subcategory_id = s.id)
            FROM subcategories s WHERE s.id = ${subcategoryId}
            RETURNING id, title, done`;
          return rows.length ? json(rows[0], 201) : notFound();
        }),
      ),
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/activities\/(\w+)$/,
    handler: ({ sql, params, body }) =>
      validated(parseId(params[0]), (id) =>
        // Partial update: null fields keep their current value.
        validated(parseActivityUpdate(body), async ({ title, done }) => {
          const rows = await sql`
            UPDATE activities SET
              title = COALESCE(${title}::text, title),
              done = COALESCE(${done}::boolean, done),
              done_at = CASE
                WHEN ${done}::boolean IS NULL THEN done_at
                WHEN ${done}::boolean THEN COALESCE(done_at, now())
                ELSE NULL
              END
            WHERE id = ${id}
            RETURNING id, title, done`;
          return rows.length ? json(rows[0]) : notFound();
        }),
      ),
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/activities\/(\w+)$/,
    handler: ({ sql, params }) =>
      validated(parseId(params[0]), async (id) => {
        const rows = await sql`DELETE FROM activities WHERE id = ${id} RETURNING id`;
        return rows.length ? json({ ok: true }) : notFound();
      }),
  },
];

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const matches = routes.filter((r) => r.pattern.test(pathname));
  if (matches.length === 0) return notFound();
  const match = matches.find((r) => r.method === request.method);
  if (!match) return json({ error: 'method not allowed' }, 405);

  let body: unknown = null;
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    try {
      body = await request.json();
    } catch {
      return badRequest('body must be valid JSON');
    }
  }

  if (!env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured');
    return json({ error: 'server misconfigured' }, 500);
  }
  const params = match.pattern.exec(pathname)!.slice(1);
  try {
    return await match.handler({ sql: neon<false, false>(env.DATABASE_URL), params, body });
  } catch (err) {
    // Log the message only, with any connection string stripped — never query params.
    console.error('handler error:', err instanceof Error ? redactSecrets(err.message) : 'unknown');
    return json({ error: 'internal error' }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const corsHeaders: Record<string, string> = isAllowedOrigin(origin, env.ALLOWED_ORIGINS)
      ? {
          'Access-Control-Allow-Origin': origin!,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        }
      : { Vary: 'Origin' };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const response = await route(request, env);
    for (const [k, v] of Object.entries(corsHeaders)) response.headers.set(k, v);
    return response;
  },
};
