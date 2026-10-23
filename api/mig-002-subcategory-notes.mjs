// Adds notes to sub-categories. Safe to run more than once.
// Usage (from api/): node mig-002-subcategory-notes.mjs
import { neon } from '@neondatabase/serverless';
import { loadDatabaseUrl } from './mig-env.mjs';

const sql = neon(loadDatabaseUrl());
await sql`
  ALTER TABLE subcategories
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 10000)`;
console.log('subcategories.notes is in place.');
