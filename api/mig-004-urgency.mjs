// Adds urgency (1 = do first, 2 = important, 3 = later) to sub-categories. Safe to run more than once.
// Usage (from api/): node mig-004-urgency.mjs
import { neon } from '@neondatabase/serverless';
import { loadDatabaseUrl } from './mig-env.mjs';

const sql = neon(loadDatabaseUrl());
await sql`
  ALTER TABLE subcategories
  ADD COLUMN IF NOT EXISTS urgency SMALLINT NOT NULL DEFAULT 2 CHECK (urgency IN (1, 2, 3))`;
console.log('subcategories.urgency is in place.');
