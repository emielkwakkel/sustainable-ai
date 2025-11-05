-- Fix ID types to match frontend expectations
-- Migration: 003_fix_id_types.sql

-- Drop foreign key constraints first
ALTER TABLE calculations DROP CONSTRAINT IF EXISTS calculations_project_id_fkey;
ALTER TABLE cursor_imports DROP CONSTRAINT IF EXISTS cursor_imports_project_id_fkey;

-- Change project_id to integer in calculations table
ALTER TABLE calculations ALTER COLUMN project_id TYPE INTEGER USING project_id::TEXT::INTEGER;

-- Change project_id to integer in cursor_imports table  
ALTER TABLE cursor_imports ALTER COLUMN project_id TYPE INTEGER USING project_id::TEXT::INTEGER;

-- Change projects.id to integer
ALTER TABLE projects ALTER COLUMN id TYPE INTEGER USING id::TEXT::INTEGER;

-- Change user_id to VARCHAR in projects table
ALTER TABLE projects ALTER COLUMN user_id TYPE VARCHAR(255);

-- Change user_id to VARCHAR in user_settings table
ALTER TABLE user_settings ALTER COLUMN user_id TYPE VARCHAR(255);

-- Recreate foreign key constraints
ALTER TABLE calculations ADD CONSTRAINT calculations_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE cursor_imports ADD CONSTRAINT cursor_imports_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Update sequences to start from 1
CREATE SEQUENCE IF NOT EXISTS projects_id_seq START 1;
ALTER TABLE projects ALTER COLUMN id SET DEFAULT nextval('projects_id_seq');

CREATE SEQUENCE IF NOT EXISTS calculations_id_seq START 1;
ALTER TABLE calculations ALTER COLUMN id SET DEFAULT nextval('calculations_id_seq');

CREATE SEQUENCE IF NOT EXISTS cursor_imports_id_seq START 1;
ALTER TABLE cursor_imports ALTER COLUMN id SET DEFAULT nextval('cursor_imports_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_settings_id_seq START 1;
ALTER TABLE user_settings ALTER COLUMN id SET DEFAULT nextval('user_settings_id_seq');




