-- Create function to increment survey responses
CREATE OR REPLACE FUNCTION public.increment_survey_responses(survey_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.surveys
  SET current_responses = current_responses + 1,
      updated_at = now()
  WHERE id = survey_uuid;
END;
$$;