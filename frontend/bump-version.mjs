// Bumps the patch number in src/version.ts. Run by `npm run deploy`.
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('./src/version.ts', import.meta.url);
const src = readFileSync(file, 'utf8');
const next = src.replace(/(\d+)\.(\d+)\.(\d+)/, (_, a, b, c) => `${a}.${b}.${Number(c) + 1}`);
writeFileSync(file, next);
console.log(next.trim());
