-- Drop existing policies that are duplicated
DROP POLICY IF EXISTS "Users can view their own survey links" ON survey_links;
DROP POLICY IF EXISTS "Users can create survey links for their surveys" ON survey_links;

-- Add new columns to survey_responses for enhanced tracking
ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS response_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS survey_link_id UUID,
ADD COLUMN IF NOT EXISTS field_agent_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS location POINT,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_survey_responses_response_id ON survey_responses(response_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_link_id ON survey_responses(survey_link_id);

-- Create survey_links table for tracking unique shareable links
CREATE TABLE IF NOT EXISTS survey_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) NOT NULL,
  link_id TEXT UNIQUE NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'field')),
  created_by UUID REFERENCES auth.users(id),
  recipient TEXT,
  used_at TIMESTAMPTZ,
  credit_cost DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for survey_links
CREATE INDEX IF NOT EXISTS idx_survey_links_survey_id ON survey_links(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_link_id ON survey_links(link_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_created_by ON survey_links(created_by);

-- Enable RLS on survey_links
ALTER TABLE survey_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for survey_links
CREATE POLICY "Users can view their own survey links"
  ON survey_links FOR SELECT
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM surveys s 
      WHERE s.id = survey_links.survey_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create survey links for their surveys"
  ON survey_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM surveys s 
      WHERE s.id = survey_links.survey_id AND s.user_id = auth.uid()
    )
  );

-- Create field_sessions table for tracking field research sessions
CREATE TABLE IF NOT EXISTS field_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) NOT NULL,
  agent_id UUID REFERENCES auth.users(id) NOT NULL,
  device_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  responses_collected INTEGER DEFAULT 0,
  location POINT,
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for field_sessions
CREATE INDEX IF NOT EXISTS idx_field_sessions_survey_id ON field_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_field_sessions_agent_id ON field_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_field_sessions_status ON field_sessions(status);

-- Enable RLS on field_sessions
ALTER TABLE field_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for field_sessions
CREATE POLICY "Users can view their own field sessions"
  ON field_sessions FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Users can create their own field sessions"
  ON field_sessions FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Users can update their own field sessions"
  ON field_sessions FOR UPDATE
  USING (agent_id = auth.uid());

-- Create survey_assignments table for team management
CREATE TABLE IF NOT EXISTS survey_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) NOT NULL,
  researcher_id UUID REFERENCES auth.users(id) NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
  target_responses INTEGER DEFAULT 0,
  collected_responses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for survey_assignments
CREATE INDEX IF NOT EXISTS idx_survey_assignments_survey_id ON survey_assignments(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_researcher_id ON survey_assignments(researcher_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_assigned_by ON survey_assignments(assigned_by);

-- Enable RLS on survey_assignments
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for survey_assignments
CREATE POLICY "Users can view their own assignments"
  ON survey_assignments FOR SELECT
  USING (
    researcher_id = auth.uid() OR 
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM surveys s 
      WHERE s.id = survey_assignments.survey_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Survey owners can create assignments"
  ON survey_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM surveys s 
      WHERE s.id = survey_assignments.survey_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Survey owners can update assignments"
  ON survey_assignments FOR UPDATE
  USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM surveys s 
      WHERE s.id = survey_assignments.survey_id AND s.user_id = auth.uid()
    )
  );

-- Add foreign key from survey_responses to survey_links
ALTER TABLE survey_responses
ADD CONSTRAINT fk_survey_link
FOREIGN KEY (survey_link_id) REFERENCES survey_links(id) ON DELETE SET NULL;