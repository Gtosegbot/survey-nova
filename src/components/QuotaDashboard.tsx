import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Quota {
  id: string;
  category: 'gender' | 'age_range' | 'location';
  option_value: string;
  target_count: number;
  current_count: number;
  is_complete: boolean;
}

interface QuotaDashboardProps {
  surveyId: string;
  totalTarget?: number;
}

export function QuotaDashboard({ surveyId, totalTarget = 1000 }: QuotaDashboardProps) {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotas();
    
    // Real-time subscription
    const channel = supabase
      .channel(`quotas-${surveyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'survey_quotas',
        filter: `survey_id=eq.${surveyId}`
      }, () => {
        loadQuotas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [surveyId]);

  const loadQuotas = async () => {
    const { data, error } = await supabase
      .from('survey_quotas')
      .select('*')
      .eq('survey_id', surveyId)
      .order('category', { ascending: true });

    if (!error && data) {
      setQuotas(data as Quota[]);
    }
    setLoading(false);
  };

  const genderQuotas = quotas.filter(q => q.category === 'gender');
  const ageQuotas = quotas.filter(q => q.category === 'age_range');
  const locationQuotas = quotas.filter(q => q.category === 'location');

  const totalCollected = quotas.reduce((acc, q) => acc + q.current_count, 0) / 3;
  const totalRemaining = Math.max(0, totalTarget - totalCollected);

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gender': return <Users className="h-4 w-4" />;
      case 'age_range': return <Calendar className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Total Counter */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Meta Total de Pesquisas</span>
            <Badge variant={totalRemaining === 0 ? "destructive" : "secondary"} className="text-lg px-4 py-1">
              {totalRemaining === 0 ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Concluída
                </span>
              ) : (
                <span className="font-mono">{Math.round(totalRemaining)} restantes</span>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress 
              value={(totalCollected / totalTarget) * 100} 
              className="h-4 flex-1"
            />
            <span className="text-2xl font-bold font-mono min-w-[100px] text-right">
              {Math.round(totalCollected)} / {totalTarget}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quota Categories */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gender Quotas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Cotas por Gênero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {genderQuotas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cota configurada</p>
            ) : (
              genderQuotas.map(quota => (
                <QuotaItem key={quota.id} quota={quota} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Age Range Quotas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Cotas por Faixa Etária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ageQuotas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cota configurada</p>
            ) : (
              ageQuotas.map(quota => (
                <QuotaItem key={quota.id} quota={quota} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Location Quotas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              Cotas por Localidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
            {locationQuotas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cota configurada</p>
            ) : (
              locationQuotas.map(quota => (
                <QuotaItem key={quota.id} quota={quota} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuotaItem({ quota }: { quota: Quota }) {
  const remaining = Math.max(0, quota.target_count - quota.current_count);
  const percentage = (quota.current_count / quota.target_count) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate flex-1">{quota.option_value}</span>
        {quota.is_complete ? (
          <Badge variant="destructive" className="text-xs ml-2">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Cota cheia
          </Badge>
        ) : (
          <span className="font-mono text-xs ml-2 text-muted-foreground">
            {remaining} restantes
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 flex-1 ${quota.is_complete ? '[&>div]:bg-destructive' : percentage >= 80 ? '[&>div]:bg-yellow-500' : ''}`}
        />
        <span className="font-mono text-xs min-w-[60px] text-right">
          {quota.current_count}/{quota.target_count}
        </span>
      </div>
    </div>
  );
}
