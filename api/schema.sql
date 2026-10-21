-- Reference schema for the To Do List API (Neon Postgres).
-- Apply changes via mig-*.mjs scripts; keep this file in sync as the source of truth.

-- Categories are fixed: Work, Business, Other.
CREATE TABLE IF NOT EXISTS subcategories (
  id          SERIAL PRIMARY KEY,
  category    TEXT NOT NULL CHECK (category IN ('work', 'business', 'other')),
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  position    INTEGER NOT NULL DEFAULT 0,
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
