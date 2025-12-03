-- Tabela de cotas demográficas por pesquisa
CREATE TABLE IF NOT EXISTS public.survey_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gender', 'age_range', 'location')),
  option_value TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  current_count INTEGER NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2),
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, category, option_value)
);

-- Tabela de limites de disparo por canal
CREATE TABLE IF NOT EXISTS public.dispatch_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'voip')),
  max_dispatches INTEGER NOT NULL DEFAULT 0,
  current_dispatches INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, channel)
);

-- Tabela de respostas offline pendentes
CREATE TABLE IF NOT EXISTS public.offline_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  response_data JSONB NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.survey_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for survey_quotas
CREATE POLICY "Users can view quotas for their surveys" ON public.survey_quotas
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_quotas.survey_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_quotas.survey_id AND is_public = true)
);

CREATE POLICY "Users can manage quotas for their surveys" ON public.survey_quotas
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_quotas.survey_id AND user_id = auth.uid())
);

-- RLS Policies for dispatch_limits
CREATE POLICY "Users can view dispatch limits for their surveys" ON public.dispatch_limits
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.surveys WHERE id = dispatch_limits.survey_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage dispatch limits for their surveys" ON public.dispatch_limits
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.surveys WHERE id = dispatch_limits.survey_id AND user_id = auth.uid())
);

-- RLS Policies for offline_responses
CREATE POLICY "Anyone can insert offline responses for public surveys" ON public.offline_responses
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.surveys WHERE id = offline_responses.survey_id AND is_public = true)
);

CREATE POLICY "Survey owners can view offline responses" ON public.offline_responses
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.surveys WHERE id = offline_responses.survey_id AND user_id = auth.uid())
);

-- Function to check and update quota
CREATE OR REPLACE FUNCTION public.check_and_update_quota(
  p_survey_id UUID,
  p_gender TEXT DEFAULT NULL,
  p_age_range TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota RECORD;
  v_result JSONB := '{"allowed": true, "quotas": {}}'::jsonb;
  v_category TEXT;
  v_value TEXT;
BEGIN
  -- Check gender quota
  IF p_gender IS NOT NULL THEN
    SELECT * INTO v_quota FROM survey_quotas 
    WHERE survey_id = p_survey_id AND category = 'gender' AND LOWER(option_value) = LOWER(p_gender);
    
    IF FOUND THEN
      IF v_quota.current_count >= v_quota.target_count THEN
        v_result := jsonb_set(v_result, '{allowed}', 'false');
        v_result := jsonb_set(v_result, '{quotas, gender}', jsonb_build_object(
          'full', true,
          'message', 'Cota de gênero concluída. Pesquise outra cota.',
          'current', v_quota.current_count,
          'target', v_quota.target_count
        ));
      ELSE
        v_result := jsonb_set(v_result, '{quotas, gender}', jsonb_build_object(
          'full', false,
          'remaining', v_quota.target_count - v_quota.current_count,
          'current', v_quota.current_count,
          'target', v_quota.target_count
        ));
      END IF;
    END IF;
  END IF;

  -- Check age_range quota
  IF p_age_range IS NOT NULL THEN
    SELECT * INTO v_quota FROM survey_quotas 
    WHERE survey_id = p_survey_id AND category = 'age_range' AND option_value = p_age_range;
    
    IF FOUND THEN
      IF v_quota.current_count >= v_quota.target_count THEN
        v_result := jsonb_set(v_result, '{allowed}', 'false');
        v_result := jsonb_set(v_result, '{quotas, age_range}', jsonb_build_object(
          'full', true,
          'message', 'Cota de faixa etária concluída. Pesquise outra cota.',
          'current', v_quota.current_count,
          'target', v_quota.target_count
        ));
      ELSE
        v_result := jsonb_set(v_result, '{quotas, age_range}', jsonb_build_object(
          'full', false,
          'remaining', v_quota.target_count - v_quota.current_count,
          'current', v_quota.current_count,
          'target', v_quota.target_count
        ));
      END IF;
    END IF;
  END IF;

  -- Check location quota
  IF p_location IS NOT NULL THEN
    SELECT * INTO v_quota FROM survey_quotas 
    WHERE survey_id = p_survey_id AND category = 'location' AND LOWER(option_value) = LOWER(p_location);
    
    IF FOUND THEN
      IF v_quota.current_count >= v_quota.target_count THEN
        v_result := jsonb_set(v_result, '{allowed}', 'false');
        v_result := jsonb_set(v_result, '{quotas, location}', jsonb_build_object(
          'full', true,
          'message', 'Cota de localidade concluída. Pesquise outra cota.',
          'current', v_quota.current_count,
          'target', v_quota.target_count
        ));
      ELSE
        v_result := jsonb_set(v_result, '{quotas, location}', jsonb_build_object(
          'full', false,
          'remaining', v_quota.target_count - v_quota.current_count,
          'current', v_quota.current_count,
          'target', v_quota.target_count
        ));
      END IF;
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

-- Function to increment quota counts after response
CREATE OR REPLACE FUNCTION public.increment_quota_counts(
  p_survey_id UUID,
  p_gender TEXT DEFAULT NULL,
  p_age_range TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update gender quota
  IF p_gender IS NOT NULL THEN
    UPDATE survey_quotas 
    SET current_count = current_count + 1,
        is_complete = (current_count + 1 >= target_count),
        updated_at = now()
    WHERE survey_id = p_survey_id AND category = 'gender' AND LOWER(option_value) = LOWER(p_gender);
  END IF;

  -- Update age_range quota
  IF p_age_range IS NOT NULL THEN
    UPDATE survey_quotas 
    SET current_count = current_count + 1,
        is_complete = (current_count + 1 >= target_count),
        updated_at = now()
    WHERE survey_id = p_survey_id AND category = 'age_range' AND option_value = p_age_range;
  END IF;

  -- Update location quota
  IF p_location IS NOT NULL THEN
    UPDATE survey_quotas 
    SET current_count = current_count + 1,
        is_complete = (current_count + 1 >= target_count),
        updated_at = now()
    WHERE survey_id = p_survey_id AND category = 'location' AND LOWER(option_value) = LOWER(p_location);
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to check dispatch limits
CREATE OR REPLACE FUNCTION public.check_dispatch_limit(
  p_survey_id UUID,
  p_channel TEXT,
  p_count INTEGER DEFAULT 1
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit RECORD;
BEGIN
  SELECT * INTO v_limit FROM dispatch_limits 
  WHERE survey_id = p_survey_id AND channel = p_channel;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'message', 'Sem limite configurado');
  END IF;
  
  IF v_limit.current_dispatches + p_count > v_limit.max_dispatches THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'message', format('Limite de %s atingido: %s/%s', p_channel, v_limit.current_dispatches, v_limit.max_dispatches),
      'current', v_limit.current_dispatches,
      'max', v_limit.max_dispatches
    );
  END IF;
  
  -- Increment dispatch count
  UPDATE dispatch_limits 
  SET current_dispatches = current_dispatches + p_count,
      updated_at = now()
  WHERE id = v_limit.id;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_limit.max_dispatches - v_limit.current_dispatches - p_count,
    'current', v_limit.current_dispatches + p_count,
    'max', v_limit.max_dispatches
  );
END;
$$;

-- Trigger to update survey total responses
CREATE OR REPLACE FUNCTION public.update_survey_total_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update survey current_responses based on total quota counts
  UPDATE surveys 
  SET current_responses = (
    SELECT COALESCE(SUM(current_count), 0) / 3 
    FROM survey_quotas 
    WHERE survey_id = NEW.survey_id
  )
  WHERE id = NEW.survey_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_survey_quota
AFTER UPDATE ON public.survey_quotas
FOR EACH ROW
EXECUTE FUNCTION public.update_survey_total_quota();