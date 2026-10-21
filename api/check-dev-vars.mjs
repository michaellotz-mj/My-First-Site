// Checks the shape of DATABASE_URL in .dev.vars without ever printing its value.
// Usage (from api/): node check-dev-vars.mjs   — exits 1 and lists problems if malformed.
import { readFileSync } from 'node:fs';

const text = readFileSync(new URL('./.dev.vars', import.meta.url), 'utf8');
const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
const problems = [];

const dbLines = lines.filter((l) => /^\s*DATABASE_URL\s*=/.test(l));
if (dbLines.length === 0) problems.push('no line starts with DATABASE_URL=');
if (dbLines.length > 1) problems.push(`DATABASE_URL appears ${dbLines.length} times (expected once)`);

const strays = lines.filter((l) => !/^\s*(#|[A-Z0-9_]+\s*=)/.test(l));
if (strays.length) problems.push(`${strays.length} line(s) are not KEY=value — is the URL split across lines?`);

if (dbLines.length === 1) {
  const raw = dbLines[0].replace(/^\s*DATABASE_URL\s*=/, '');
  if (/^\s/.test(raw)) problems.push('space after DATABASE_URL= (remove it)');
  const value = raw.trim();
  if (/\bpsql\b/.test(value)) problems.push("value contains 'psql' — copy the plain connection string, not the psql command");
  if (/\s/.test(value)) problems.push('value contains spaces');
  const unquoted = value.replace(/^["']|["']$/g, '');
  if (!/^postgres(ql)?:\/\//.test(unquoted)) {
    problems.push('value must start with postgresql://');
  } else {
    if (/^postgres(ql)?:\/\/postgres(ql)?:/.test(unquoted)) problems.push('postgresql:// appears twice at the start');
    if (/[…<>\[\]]/.test(unquoted)) problems.push('value contains …, < > or [ ] — it looks like a copied example, not the real string from Neon');
    try {
      // Parse the way the Neon driver does: swap the scheme for http: so the host is validated strictly.
      const scheme = new URL(unquoted).protocol;
      const url = new URL('http:' + unquoted.slice(scheme.length));
      if (!url.username) problems.push('URL has no user name');
      if (!url.password) problems.push('URL has no password — use "Show password" before copying');
      if (!url.hostname) problems.push('URL has no host');
      if (url.pathname.length <= 1) problems.push('URL has no database name after the host (e.g. /neondb)');
    } catch {
      problems.push('value is not a valid URL');
    }
  }
}

if (problems.length) {
  console.error('DEV_VARS / .dev.vars problems (value not shown):');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('DATABASE_URL looks well-formed.');
