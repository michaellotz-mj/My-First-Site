// Lets the three fixed categories be renamed (custom tab and heading names). Safe to run more than once.
// Usage (from api/): node mig-006-category-labels.mjs
import { neon } from '@neondatabase/serverless';
import { loadDatabaseUrl } from './mig-env.mjs';

const sql = neon(loadDatabaseUrl());
await sql`
  CREATE TABLE IF NOT EXISTS category_labels (
    category  TEXT PRIMARY KEY CHECK (category IN ('work', 'business', 'other')),
    label     TEXT NOT NULL CHECK (length(label) BETWEEN 1 AND 20)
  )`;
console.log('category_labels is in place.');
