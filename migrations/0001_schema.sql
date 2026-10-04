-- TradeSense schema. Portable conventions: TEXT ULID ids, ISO-8601 TEXT timestamps, INTEGER booleans.

CREATE TABLE markets (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gold','forex','index','crypto','oil','dxy')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE analysts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_attachment_id TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','editor','analyst','member')),
  password_hash TEXT,
  totp_secret TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- sessions.id = sha256 hex of the cookie token (raw token is never stored)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL
);

-- magic_link_tokens.id = sha256 hex of the emailed token
CREATE TABLE magic_link_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  diff_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily','weekly')),
  market_id TEXT NOT NULL REFERENCES markets(id),
  post_date TEXT NOT NULL,
  week_start_date TEXT NOT NULL,
  bias TEXT NOT NULL CHECK (bias IN ('bullish','bearish','neutral')),
  confidence TEXT NOT NULL CHECK (confidence IN ('high','medium','low')),
  sentiment TEXT CHECK (sentiment IN ('risk_on','risk_off','mixed')),
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body_md TEXT NOT NULL DEFAULT '',
  key_drivers_md TEXT NOT NULL DEFAULT '',
  risk_events_md TEXT NOT NULL DEFAULT '',
  invalidation_md TEXT NOT NULL DEFAULT '', -- text only, never a price level
  access TEXT NOT NULL DEFAULT 'free' CHECK (access IN ('free','paid')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published')),
  publish_at TEXT,
  valid_from TEXT,
  valid_until TEXT,
  analyst_id TEXT REFERENCES analysts(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  published_at TEXT
);

CREATE TABLE killzone_notes (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES markets(id),
  killzone TEXT NOT NULL CHECK (killzone IN ('asia','london','ny_am','ny_pm')),
  note_date TEXT NOT NULL,
  linked_post_id TEXT NOT NULL REFERENCES posts(id),
  status TEXT NOT NULL CHECK (status IN ('followed','non_followed','invalidation','neutral')),
  confidence TEXT CHECK (confidence IN ('high','medium','low')),
  title TEXT NOT NULL DEFAULT '',
  note_md TEXT NOT NULL DEFAULT '',
  access TEXT NOT NULL DEFAULT 'paid' CHECK (access IN ('free','paid')),
  publish_status TEXT NOT NULL DEFAULT 'draft' CHECK (publish_status IN ('draft','scheduled','published')),
  publish_at TEXT,
  analyst_id TEXT REFERENCES analysts(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  published_at TEXT
);

CREATE TABLE evaluation_rules (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE,
  text_md TEXT NOT NULL,
  active_from TEXT NOT NULL
);

CREATE TABLE results (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE REFERENCES posts(id),
  outcome TEXT NOT NULL CHECK (outcome IN ('correct','wrong','partial')),
  note_md TEXT NOT NULL CHECK (length(trim(note_md)) > 0),
  evaluated_by TEXT NOT NULL REFERENCES users(id),
  evaluated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  evaluation_rule_version INTEGER NOT NULL
);

CREATE TABLE result_corrections (
  id TEXT PRIMARY KEY,
  result_id TEXT NOT NULL REFERENCES results(id),
  new_outcome TEXT NOT NULL CHECK (new_outcome IN ('correct','wrong','partial')),
  reason_md TEXT NOT NULL CHECK (length(trim(reason_md)) > 0),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('post','note','result')),
  owner_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('bias_chart','result_chart','note_chart','other')),
  r2_key TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL, -- computed server-side at upload, never client-supplied
  caption TEXT NOT NULL DEFAULT '',
  access TEXT NOT NULL DEFAULT 'inherit' CHECK (access IN ('inherit','free','paid','public')),
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0,1))
);

CREATE TABLE post_revisions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post','note')),
  entity_id TEXT NOT NULL,
  old_json TEXT NOT NULL,
  new_json TEXT NOT NULL,
  edited_by TEXT NOT NULL REFERENCES users(id),
  edited_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE note_tags (
  note_id TEXT NOT NULL REFERENCES killzone_notes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  currency TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('calendar','manual')),
  description_md TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price_usd REAL NOT NULL CHECK (price_usd >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Used ONLY if setting regional_pricing_enabled = true
CREATE TABLE region_prices (
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  price_usd REAL NOT NULL CHECK (price_usd >= 0),
  PRIMARY KEY (plan_id, country_code)
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL REFERENCES plans(id),
  provider TEXT NOT NULL DEFAULT 'nowpayments',
  provider_payment_id TEXT,
  provider_invoice_id TEXT,
  price_amount REAL NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'usd',
  pay_currency TEXT,
  actually_paid REAL,
  status TEXT NOT NULL DEFAULT 'created',
  raw_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- One current subscription row per user; extended on each paid/granted period.
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  plan_id TEXT REFERENCES plans(id),
  status TEXT NOT NULL CHECK (status IN ('active','expired','cancelled')),
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  granted_manually INTEGER NOT NULL DEFAULT 0 CHECK (granted_manually IN (0,1)),
  granted_by TEXT REFERENCES users(id),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE bookmarks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post','note')),
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE TABLE view_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  viewed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ip_hash TEXT
);

CREATE TABLE saved_views (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  name TEXT NOT NULL,
  filters_json TEXT NOT NULL DEFAULT '{}',
  columns_json TEXT NOT NULL DEFAULT '[]',
  shared INTEGER NOT NULL DEFAULT 0 CHECK (shared IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
