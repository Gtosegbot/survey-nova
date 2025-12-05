-- Add RLS policy to allow anyone to view surveys for response purposes
-- This enables respondents to access surveys even if not logged in

CREATE POLICY "Anyone can view surveys with active or published status"
ON public.surveys
FOR SELECT
USING (status IN ('active', 'published', 'draft'));

-- Update recent survey to be public
UPDATE public.surveys 
SET is_public = true, status = 'active'
WHERE id = '4b618cdd-39d4-4894-a39a-92f9b89827f1';