-- Projects, per AquaSite_Product_Specification.md Section 4.2.
-- project_code uniqueness is scoped to the organization (not global), since
-- two different companies could reasonably reuse the same code.

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  project_code TEXT NOT NULL,
  project_name TEXT NOT NULL,
  client TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_projects_org_code ON projects(org_id, project_code);
CREATE INDEX idx_projects_org_id ON projects(org_id);
