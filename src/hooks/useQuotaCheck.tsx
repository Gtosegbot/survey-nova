import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuotaCheckResult {
  allowed: boolean;
  quotas: {
    gender?: {
      full: boolean;
      message?: string;
      remaining?: number;
      current: number;
      target: number;
    };
    age_range?: {
      full: boolean;
      message?: string;
      remaining?: number;
      current: number;
      target: number;
    };
    location?: {
      full: boolean;
      message?: string;
      remaining?: number;
      current: number;
      target: number;
    };
  };
}

export function useQuotaCheck() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QuotaCheckResult | null>(null);
  const { toast } = useToast();

  const checkQuota = useCallback(async (
    surveyId: string,
    gender?: string,
    ageRange?: string,
    location?: string
  ): Promise<QuotaCheckResult> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('check_and_update_quota', {
        p_survey_id: surveyId,
        p_gender: gender || null,
        p_age_range: ageRange || null,
        p_location: location || null
      });

      if (error) {
        console.error('Error checking quota:', error);
        // Return allowed if there's an error (fail open for quotas)
        return { allowed: true, quotas: {} };
      }

      const result = data as unknown as QuotaCheckResult;
      setLastResult(result);

      // Show toast if quota is full
      if (!result.allowed) {
        const fullQuotas = Object.entries(result.quotas)
          .filter(([_, q]) => q?.full)
          .map(([category, q]) => q?.message || `Cota de ${category} cheia`);
        
        toast({
          title: "Cota concluída!",
          description: fullQuotas.join(' '),
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Error in quota check:', error);
      return { allowed: true, quotas: {} };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const incrementQuota = useCallback(async (
    surveyId: string,
    gender?: string,
    ageRange?: string,
    location?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('increment_quota_counts', {
        p_survey_id: surveyId,
        p_gender: gender || null,
        p_age_range: ageRange || null,
        p_location: location || null
      });

      if (error) {
        console.error('Error incrementing quota:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in quota increment:', error);
      return false;
    }
  }, []);

  const checkDispatchLimit = useCallback(async (
    surveyId: string,
    channel: 'email' | 'sms' | 'whatsapp' | 'voip',
    count: number = 1
  ): Promise<{ allowed: boolean; remaining?: number; message?: string }> => {
    try {
      const { data, error } = await supabase.rpc('check_dispatch_limit', {
        p_survey_id: surveyId,
        p_channel: channel,
        p_count: count
      });

      if (error) {
        console.error('Error checking dispatch limit:', error);
        return { allowed: true };
      }

      const result = data as { allowed: boolean; remaining?: number; message?: string };
      
      if (!result.allowed) {
        toast({
          title: "Limite de disparo atingido",
          description: result.message || `Limite de ${channel} esgotado`,
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Error in dispatch limit check:', error);
      return { allowed: true };
    }
  }, [toast]);

  return {
    checkQuota,
    incrementQuota,
    checkDispatchLimit,
    loading,
    lastResult
  };
}
