import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";

export const NotificationListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to new survey responses
    const channel = supabase
      .channel('survey-responses-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'survey_responses'
        },
        (payload) => {
          console.log('🔔 Nova resposta recebida:', payload);
          
          toast({
            title: "Nova resposta coletada! 🎉",
            description: "Uma nova resposta foi adicionada à pesquisa.",
            action: (
              <Bell className="h-5 w-5 text-primary animate-pulse" />
            ),
          });
        }
      )
      .subscribe();

    console.log('👂 Listening for real-time survey responses...');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return null;
};
