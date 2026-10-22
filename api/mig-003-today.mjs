// Adds the Today list to sub-categories. Safe to run more than once.
// Usage (from api/): node mig-003-today.mjs
import { neon } from '@neondatabase/serverless';
import { loadDatabaseUrl } from './mig-env.mjs';

const sql = neon(loadDatabaseUrl());
await sql`ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS today BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS today_position INTEGER NOT NULL DEFAULT 0`;
console.log('subcategories.today and today_position are in place.');
