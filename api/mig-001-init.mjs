// One-off migration: creates the initial tables from schema.sql.
// Usage (from api/): node mig-001-init.mjs
// Reads DATABASE_URL from .dev.vars — never pass it on the command line.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { loadDatabaseUrl } from './mig-env.mjs';

const sql = neon(loadDatabaseUrl());
const statements = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
  .split(/;\s*$/m)
  .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
}
console.log(`Applied ${statements.length} statements.`);
