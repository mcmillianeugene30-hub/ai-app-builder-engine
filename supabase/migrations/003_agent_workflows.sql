-- Agent Workflow Tables
-- Multi-agent orchestration system

-- ============================================
-- AGENT WORKFLOWS TABLE
-- ============================================
CREATE TABLE agent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  initial_prompt TEXT NOT NULL,
  phases TEXT[] NOT NULL DEFAULT ARRAY['planning', 'development', 'production', 'deployment'],
  current_phase TEXT NOT NULL DEFAULT 'planning',
  overall_progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed', 'paused')),
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_workflows_user_id ON agent_workflows(user_id);
CREATE INDEX idx_agent_workflows_project_id ON agent_workflows(project_id);
CREATE INDEX idx_agent_workflows_status ON agent_workflows(status);

-- ============================================
-- AGENT TASKS TABLE
-- ============================================
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('planning', 'development', 'production', 'deployment')),
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  tokens_used INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0, -- milliseconds
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_agent_tasks_workflow_id ON agent_tasks(workflow_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_agent_id ON agent_tasks(agent_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users can only see their own workflows
CREATE POLICY agent_workflows_user_policy ON agent_workflows
  FOR ALL USING (user_id = auth.uid());

-- Users can only see tasks for their workflows
CREATE POLICY agent_tasks_user_policy ON agent_tasks
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM agent_workflows WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE agent_workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_tasks;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_workflows_updated_at
  BEFORE UPDATE ON agent_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Create workflow with tasks
-- ============================================
CREATE OR REPLACE FUNCTION create_agent_workflow(
  p_project_id UUID,
  p_user_id TEXT,
  p_initial_prompt TEXT
)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO agent_workflows (project_id, user_id, initial_prompt)
  VALUES (p_project_id, p_user_id, p_initial_prompt)
  RETURNING id INTO v_workflow_id;
  
  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql;
