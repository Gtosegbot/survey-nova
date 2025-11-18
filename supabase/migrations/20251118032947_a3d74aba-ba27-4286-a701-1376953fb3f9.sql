-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'survey-audio',
  'survey-audio',
  false,
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for audio storage
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'survey-audio');

CREATE POLICY "Users can view their own audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'survey-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'survey-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add audio_url column to survey_responses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_responses' 
    AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE survey_responses 
    ADD COLUMN audio_url text;
  END IF;
END $$;