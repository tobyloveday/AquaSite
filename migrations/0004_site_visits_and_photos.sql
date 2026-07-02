-- Site visits and photos, per AquaSite_Product_Specification.md Section 4.2.
-- Photo capture is online-only for now: photos are uploaded directly on
-- capture, so sync_status is 'synced' the moment the row exists. The
-- 'pending'/'failed' states come into play once offline queuing is added.

CREATE TABLE site_visits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE INDEX idx_site_visits_project_id ON site_visits(project_id);

CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES site_visits(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  r2_object_key TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  notes TEXT,
  captured_at TEXT NOT NULL,
  synced_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed'))
);

CREATE INDEX idx_photos_visit_id ON photos(visit_id);
CREATE INDEX idx_photos_project_id ON photos(project_id);
