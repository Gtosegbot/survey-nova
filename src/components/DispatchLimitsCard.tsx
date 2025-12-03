import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Phone, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DispatchLimit {
  id: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'voip';
  max_dispatches: number;
  current_dispatches: number;
}

interface DispatchLimitsCardProps {
  surveyId: string;
}

const CHANNEL_CONFIG = {
  email: {
    label: 'Email',
    icon: Mail,
    color: 'text-blue-500',
    defaultMax: 10000,
    cost: 0.05,
  },
  sms: {
    label: 'SMS',
    icon: MessageSquare,
    color: 'text-green-500',
    defaultMax: 1000,
    cost: 0.15,
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: Send,
    color: 'text-emerald-500',
    defaultMax: 500,
    cost: 1.00,
  },
  voip: {
    label: 'Voz (VoIP)',
    icon: Phone,
    color: 'text-purple-500',
    defaultMax: 300,
    cost: 2.50,
  },
};

export function DispatchLimitsCard({ surveyId }: DispatchLimitsCardProps) {
  const [limits, setLimits] = useState<DispatchLimit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLimits();

    // Real-time subscription
    const channel = supabase
      .channel(`dispatch-limits-${surveyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dispatch_limits',
        filter: `survey_id=eq.${surveyId}`
      }, () => {
        loadLimits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [surveyId]);

  const loadLimits = async () => {
    const { data, error } = await supabase
      .from('dispatch_limits')
      .select('*')
      .eq('survey_id', surveyId);

    if (!error && data) {
      setLimits(data as DispatchLimit[]);
    }
    setLoading(false);
  };

  const getLimit = (channel: keyof typeof CHANNEL_CONFIG): DispatchLimit | undefined => {
    return limits.find(l => l.channel === channel);
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Limites de Disparo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(CHANNEL_CONFIG) as Array<keyof typeof CHANNEL_CONFIG>).map(channel => {
            const config = CHANNEL_CONFIG[channel];
            const limit = getLimit(channel);
            const current = limit?.current_dispatches || 0;
            const max = limit?.max_dispatches || config.defaultMax;
            const remaining = max - current;
            const percentage = (current / max) * 100;
            const isWarning = percentage >= 80;
            const isFull = percentage >= 100;
            const Icon = config.icon;

            return (
              <div key={channel} className="space-y-2 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  {isFull && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Esgotado
                    </Badge>
                  )}
                </div>
                
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={`h-2 ${isFull ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-yellow-500' : ''}`}
                />
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    R$ {config.cost.toFixed(2)}/envio
                  </span>
                  <span className="font-mono">
                    {remaining.toLocaleString()} restantes
                  </span>
                </div>
                
                <div className="text-center font-mono text-lg font-bold">
                  {current.toLocaleString()} / {max.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
