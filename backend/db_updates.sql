-- Incremental SQL updates for an EXISTING pdms database.
-- Do not run this against a fresh database created from schema.sql —
-- schema.sql already includes these changes in its CREATE TABLE statements.
-- Apply each block once, in order, only to a database that predates it.

-- 2026-09-14: self-registration with admin approval
ALTER TABLE pdms.users ADD COLUMN is_approved boolean NOT NULL DEFAULT false;
UPDATE pdms.users SET is_approved = true;

-- 2026-09-14: user groups & per-page permissions
CREATE TYPE pdms.resourcepage AS ENUM ('PROJECTS', 'MODULES', 'REQUIREMENTS', 'TASKS', 'MILESTONES', 'DELIVERIES');

CREATE TABLE pdms.groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE pdms.group_permissions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES pdms.groups(id),
    page pdms.resourcepage NOT NULL,
    can_read BOOLEAN NOT NULL,
    can_write BOOLEAN NOT NULL,
    CONSTRAINT uq_group_permissions_group_page UNIQUE (group_id, page)
);

ALTER TABLE pdms.users ADD COLUMN group_id INTEGER REFERENCES pdms.groups(id);

-- Seed a full-access default group and backfill existing non-admin users into it,
-- so nobody loses access the instant this migration runs.
INSERT INTO pdms.groups (name, description, created_at)
VALUES ('Default Access', 'Auto-created on migration; full read/write on all pages.', now());

INSERT INTO pdms.group_permissions (group_id, page, can_read, can_write)
SELECT id, unnest(enum_range(NULL::pdms.resourcepage)), true, true
FROM pdms.groups WHERE name = 'Default Access';

UPDATE pdms.users SET group_id = (SELECT id FROM pdms.groups WHERE name = 'Default Access')
WHERE role != 'ADMIN';
