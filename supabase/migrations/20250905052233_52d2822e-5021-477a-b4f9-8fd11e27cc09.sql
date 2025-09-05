-- Criar tabela para logs de SMS
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id TEXT,
  campaign_id TEXT,
  status TEXT DEFAULT 'pending',
  cost DECIMAL(10,2) DEFAULT 0.00,
  provider_response JSONB,
  delivery_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS logs
CREATE POLICY "Users can view their own SMS logs" 
ON public.sms_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SMS logs" 
ON public.sms_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SMS logs" 
ON public.sms_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_sms_logs_updated_at
BEFORE UPDATE ON public.sms_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para profiles de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  plan_type TEXT DEFAULT 'free',
  permissions JSONB DEFAULT '{"can_create_surveys": true, "can_manage_team": false, "can_access_admin": false}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para pesquisas (surveys)
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  mandatory_questions JSONB NOT NULL DEFAULT '{}',
  target_sample_size INTEGER DEFAULT 100,
  current_responses INTEGER DEFAULT 0,
  quotas JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  methodology TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- Create policies for surveys
CREATE POLICY "Users can view their own surveys" 
ON public.surveys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own surveys" 
ON public.surveys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys" 
ON public.surveys 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own surveys" 
ON public.surveys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Public surveys are viewable by everyone
CREATE POLICY "Public surveys are viewable by everyone" 
ON public.surveys 
FOR SELECT 
USING (is_public = true);

-- Trigger for updated_at
CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON public.surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para respostas de pesquisas
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  respondent_data JSONB NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  demographics JSONB NOT NULL DEFAULT '{}',
  validation_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  coordinates POINT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_valid BOOLEAN DEFAULT true,
  confidence_score DECIMAL(3,2) DEFAULT 1.00
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for survey responses
CREATE POLICY "Survey responses are viewable by survey owners" 
ON public.survey_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_responses.survey_id 
    AND surveys.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert survey responses for public surveys" 
ON public.survey_responses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_responses.survey_id 
    AND surveys.is_public = true
  )
);

-- Add index for better performance
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_completed_at ON public.survey_responses(completed_at);