// One-off migration: creates the initial tables from schema.sql.
// Usage (from api/): node mig-001-init.mjs
// Reads DATABASE_URL from .dev.vars — never pass it on the command line.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

function loadDevVars() {
  const vars = {};
  for (const line of readFileSync(new URL('./.dev.vars', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

const { DATABASE_URL } = loadDevVars();
if (!DATABASE_URL) {
  console.error('DATABASE_URL missing from api/.dev.vars');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const statements = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
  .split(/;\s*$/m)
  .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
}
console.log(`Applied ${statements.length} statements.`);
