// Shared by the mig-*.mjs scripts: reads DATABASE_URL from .dev.vars (never from the command line).
import { readFileSync } from 'node:fs';

export function loadDatabaseUrl() {
  const vars = {};
  for (const line of readFileSync(new URL('./.dev.vars', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  if (!vars.DATABASE_URL) {
    console.error('DATABASE_URL missing from api/.dev.vars');
    process.exit(1);
  }
  return vars.DATABASE_URL;
}
