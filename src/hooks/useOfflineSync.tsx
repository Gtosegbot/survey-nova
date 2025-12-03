import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingResponse {
  id: string;
  surveyId: string;
  responseData: any;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
}

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Check for pending responses
  const checkPendingResponses = useCallback(() => {
    const keys = Object.keys(localStorage).filter(k => 
      k.startsWith('offline_response_')
    );
    
    const pending = keys.filter(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return data.syncStatus === 'pending' || data.syncStatus === 'failed';
      } catch {
        return false;
      }
    });
    
    setPendingCount(pending.length);
    return pending;
  }, []);

  // Save response offline
  const saveOffline = useCallback((surveyId: string, responseData: any) => {
    const id = `offline_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineData: PendingResponse = {
      id,
      surveyId,
      responseData,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    };
    
    localStorage.setItem(id, JSON.stringify(offlineData));
    checkPendingResponses();
    
    toast({
      title: "Salvo offline",
      description: "A resposta será sincronizada quando a conexão retornar.",
    });
    
    return id;
  }, [checkPendingResponses, toast]);

  // Sync a single response
  const syncResponse = async (key: string): Promise<boolean> => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}') as PendingResponse;
      if (!data.surveyId || !data.responseData) return false;

      // Update status to syncing
      data.syncStatus = 'syncing';
      localStorage.setItem(key, JSON.stringify(data));

      // Try to insert into Supabase
      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: data.surveyId,
          respondent_data: data.responseData.respondentData || {},
          answers: data.responseData.answers || {},
          demographics: data.responseData.demographics || {},
          completed_at: data.createdAt,
          device_info: data.responseData.deviceInfo || {},
        });

      if (error) {
        console.error('Sync error:', error);
        data.syncStatus = 'failed';
        localStorage.setItem(key, JSON.stringify(data));
        return false;
      }

      // Remove from localStorage on success
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error syncing response:', error);
      return false;
    }
  };

  // Sync all pending responses
  const syncAll = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    const pendingKeys = checkPendingResponses();
    
    if (pendingKeys.length === 0) {
      setIsSyncing(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const key of pendingKeys) {
      const success = await syncResponse(key);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    checkPendingResponses();
    setIsSyncing(false);

    if (successCount > 0) {
      toast({
        title: "Sincronização concluída",
        description: `${successCount} resposta(s) sincronizada(s) com sucesso.`,
      });
    }

    if (failCount > 0) {
      toast({
        title: "Erro na sincronização",
        description: `${failCount} resposta(s) não puderam ser sincronizadas.`,
        variant: "destructive",
      });
    }
  }, [isSyncing, checkPendingResponses, toast]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Iniciando sincronização automática...",
      });
      // Auto sync after 2 seconds
      setTimeout(syncAll, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Sem conexão",
        description: "As respostas serão salvas localmente.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending on mount
    checkPendingResponses();

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      checkPendingResponses();
      if (navigator.onLine && pendingCount > 0) {
        syncAll();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncAll, checkPendingResponses, pendingCount, toast]);

  return {
    pendingCount,
    isOnline,
    isSyncing,
    saveOffline,
    syncAll,
    checkPendingResponses,
  };
}
