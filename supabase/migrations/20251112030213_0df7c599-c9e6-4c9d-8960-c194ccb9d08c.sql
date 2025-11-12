-- Create contact_groups table for organizing contacts
CREATE TABLE IF NOT EXISTS public.contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  tags text[], -- Tags like 'política', 'mercado', 'produto'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for contact_groups
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_groups
CREATE POLICY "Users can view their own contact groups"
  ON public.contact_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact groups"
  ON public.contact_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact groups"
  ON public.contact_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact groups"
  ON public.contact_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Update contacts table to add group_id if not exists
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.contact_groups(id) ON DELETE SET NULL;

-- Update campaigns table structure
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_count integer DEFAULT 0;

-- Add trigger for contact_groups updated_at
CREATE TRIGGER update_contact_groups_updated_at
  BEFORE UPDATE ON public.contact_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();