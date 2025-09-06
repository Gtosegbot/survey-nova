-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the 3 admin users
INSERT INTO public.admin_users (email) VALUES 
  ('admgtoseg@gmail.com'),
  ('gtosegbot@gmail.com'),
  ('disparoseguroback@gmail.com');

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin users are readable by service role" 
ON public.admin_users 
FOR SELECT 
USING (auth.role() = 'service_role'::text);

-- Update profiles table to include role and admin check
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- Create function to update user admin status
CREATE OR REPLACE FUNCTION public.update_user_admin_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user email is in admin list
  IF public.is_user_admin(NEW.email) THEN
    NEW.is_admin := true;
    NEW.role := 'admin';
  ELSE
    NEW.is_admin := false;
    NEW.role := 'user';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set admin status
CREATE TRIGGER update_profile_admin_status
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_admin_status();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  is_admin_user BOOLEAN := false;
BEGIN
  -- Get user email from auth.users
  user_email := NEW.email;
  
  -- Check if user is admin
  is_admin_user := public.is_user_admin(user_email);
  
  -- Insert into profiles
  INSERT INTO public.profiles (
    user_id, 
    email, 
    display_name, 
    is_admin, 
    role,
    permissions
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    is_admin_user,
    CASE WHEN is_admin_user THEN 'admin' ELSE 'user' END,
    CASE WHEN is_admin_user THEN 
      '{"can_manage_team": true, "can_access_admin": true, "can_create_surveys": true, "can_manage_users": true, "can_view_all_data": true}'::jsonb
    ELSE 
      '{"can_manage_team": false, "can_access_admin": false, "can_create_surveys": true}'::jsonb
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create survey_links table for unique links
CREATE TABLE public.survey_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  link_id TEXT UNIQUE NOT NULL,
  channel_type TEXT NOT NULL, -- 'email', 'sms', 'whatsapp', 'voip', 'web'
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient TEXT, -- email or phone number
  credit_cost DECIMAL(10,2) DEFAULT 0.00,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_links ENABLE ROW LEVEL SECURITY;

-- Create policies for survey_links
CREATE POLICY "Users can view their own survey links"
ON public.survey_links
FOR SELECT
USING (created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM public.surveys s 
  WHERE s.id = survey_links.survey_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Users can create survey links for their surveys"
ON public.survey_links
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.surveys s 
  WHERE s.id = survey_links.survey_id 
  AND s.user_id = auth.uid()
));

-- Create response_validation table
CREATE TABLE public.response_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES public.survey_responses(id) ON DELETE CASCADE NOT NULL,
  coordinates POINT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  voice_signature TEXT, -- Base64 encoded audio signature
  duplicate_score DECIMAL(3,2) DEFAULT 0.00, -- 0-1 similarity score
  is_duplicate BOOLEAN DEFAULT false,
  validation_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.response_validation ENABLE ROW LEVEL SECURITY;

-- Create policies for response_validation
CREATE POLICY "Response validation viewable by survey owners"
ON public.response_validation
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.survey_responses sr
  JOIN public.surveys s ON s.id = sr.survey_id
  WHERE sr.id = response_validation.response_id
  AND s.user_id = auth.uid()
));

-- Update surveys table for better quota management
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS geographic_quotas JSONB DEFAULT '{}';
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS demographic_breakdown JSONB DEFAULT '{}';
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS auto_stop_at_quota BOOLEAN DEFAULT true;
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS max_responses_per_location INTEGER DEFAULT 3;

-- Create function to check quota completion
CREATE OR REPLACE FUNCTION public.check_survey_quotas(survey_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN current_responses >= (target_sample_size * 1.03) THEN true
      ELSE false
    END
  FROM public.surveys 
  WHERE id = survey_uuid;
$$;