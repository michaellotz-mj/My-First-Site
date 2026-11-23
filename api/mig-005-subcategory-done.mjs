// Lets a sub-category with no activities be ticked off directly. Safe to run more than once.
// Usage (from api/): node mig-005-subcategory-done.mjs
import { neon } from '@neondatabase/serverless';
import { loadDatabaseUrl } from './mig-env.mjs';

const sql = neon(loadDatabaseUrl());
await sql`ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ`;
console.log('subcategories.done and done_at are in place.');
