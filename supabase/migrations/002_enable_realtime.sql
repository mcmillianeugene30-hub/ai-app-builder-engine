-- Enable realtime for projects table
-- This allows real-time updates when projects are modified

-- Add projects to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- Comment on table for documentation
COMMENT ON TABLE projects IS 'Stores AI-generated app projects with their file structures';

-- Comment on columns
COMMENT ON COLUMN projects.id IS 'Unique project identifier (UUID)';
COMMENT ON COLUMN projects.user_id IS 'Owner of the project (references auth.users)';
COMMENT ON COLUMN projects.name IS 'Project display name';
COMMENT ON COLUMN projects.description IS 'Optional project description';
COMMENT ON COLUMN projects.files IS 'JSON array of files with content, paths, and metadata';
COMMENT ON COLUMN projects.created_at IS 'When the project was first created';
COMMENT ON COLUMN projects.updated_at IS 'When the project was last modified';
