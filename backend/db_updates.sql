-- Incremental SQL updates for an EXISTING pdms database.
-- Do not run this against a fresh database created from schema.sql —
-- schema.sql already includes these changes in its CREATE TABLE statements.
-- Apply each block once, in order, only to a database that predates it.

-- 2026-09-14: self-registration with admin approval
ALTER TABLE pdms.users ADD COLUMN is_approved boolean NOT NULL DEFAULT false;
UPDATE pdms.users SET is_approved = true;
