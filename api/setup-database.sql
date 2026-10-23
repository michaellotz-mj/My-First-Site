-- One-paste setup for a database (e.g. Neon `production`) in the Neon SQL Editor.
-- Safe to run more than once, and safe on a database created from an older schema:
-- it creates anything missing and adds any newer columns. It never deletes data.
-- Keep in sync: when you add a mig-NNN script, add its ALTER here too.

-- Categories are fixed: Work, Business, Other.
CREATE TABLE IF NOT EXISTS subcategories (
  id          SERIAL PRIMARY KEY,
  category    TEXT NOT NULL CHECK (category IN ('work', 'business', 'other')),
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  notes       TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 10000),
  position    INTEGER NOT NULL DEFAULT 0,
  -- In the "Today" list, and its place there (separate from position within the category).
  today           BOOLEAN NOT NULL DEFAULT false,
  today_position  INTEGER NOT NULL DEFAULT 0,
  -- 1 = do first, 2 = important but not urgent (default), 3 = later.
  urgency     SMALLINT NOT NULL DEFAULT 2 CHECK (urgency IN (1, 2, 3)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subcategories_category_idx ON subcategories (category, position);

CREATE TABLE IF NOT EXISTS activities (
  id              SERIAL PRIMARY KEY,
  subcategory_id  INTEGER NOT NULL REFERENCES subcategories (id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
  done            BOOLEAN NOT NULL DEFAULT false,
  done_at         TIMESTAMPTZ,
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activities_subcategory_idx ON activities (subcategory_id, position);

-- Columns added after the first version (mig-002, mig-003, mig-004). No-ops on a fresh database.
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 10000);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS today BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS today_position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS urgency SMALLINT NOT NULL DEFAULT 2 CHECK (urgency IN (1, 2, 3));

-- Check: should list 2 tables and 15 columns in total.
SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('subcategories', 'activities')
GROUP BY table_name;
