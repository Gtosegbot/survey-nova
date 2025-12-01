-- Tabela de indicações (referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  credited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Adicionar campos de teste grátis em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_responses_limit INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS trial_responses_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Função para gerar código de referral único
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para gerar código de referral automaticamente
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_referral_code();

-- RLS policies para referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- Função para processar créditos de indicação
CREATE OR REPLACE FUNCTION public.process_referral_credits(p_referred_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral RECORD;
  v_referrer_id UUID;
BEGIN
  -- Buscar indicação pendente
  SELECT * INTO v_referral 
  FROM public.referrals 
  WHERE referred_id = p_referred_id 
  AND status = 'pending'
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_referrer_id := v_referral.referrer_id;
  
  -- Dar 20 créditos para o indicado
  PERFORM public.update_user_credits(
    p_referred_id,
    20.00,
    'purchase',
    'referral_bonus',
    'Bônus de boas-vindas por indicação',
    NULL
  );
  
  -- Dar 50 créditos para quem indicou
  PERFORM public.update_user_credits(
    v_referrer_id,
    50.00,
    'purchase',
    'referral_reward',
    'Recompensa por indicação bem-sucedida',
    NULL
  );
  
  -- Atualizar status da indicação
  UPDATE public.referrals
  SET status = 'completed',
      credited_at = now()
  WHERE id = v_referral.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;