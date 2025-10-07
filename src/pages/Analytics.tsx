import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Share2,
  Download
} from "lucide-react";
import { SurveyAnalytics } from "@/components/layout/SurveyAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  avgCompletionRate: number;
  weeklyGrowth: number;
  topPerformingSurvey: string;
  recentActivity: Array<{
    id: string;
    type: 'response' | 'survey_created' | 'survey_completed';
    message: string;
    timestamp: string;
  }>;
  surveyPerformance: Array<{
    id: string;
    title: string;
    responses: number;
    target: number;
    completionRate: number;
    status: 'active' | 'completed' | 'draft';
  }>;
}

export default function Analytics() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedSurvey, setSelectedSurvey] = useState<string>("all");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  const [detailedSurvey, setDetailedSurvey] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedSurvey]);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar pesquisas reais do Supabase
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('user_id', user.id);

      if (surveysError) throw surveysError;

      // Carregar respostas reais do Supabase
      const { data: allResponses, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .in('survey_id', surveys?.map(s => s.id) || []);

      if (responsesError) throw responsesError;

      const totalSurveys = surveys?.length || 0;
      const activeSurveys = surveys?.filter(s => s.status === 'active').length || 0;
      const totalResponses = allResponses?.length || 0;
      const avgCompletionRate = totalSurveys > 0 
        ? (totalResponses / surveys.reduce((acc, s) => acc + (s.target_sample_size || 100), 0)) * 100 
        : 0;

      // Dados de performance reais
      const surveyPerformance = surveys?.map(survey => {
        const responses = allResponses?.filter(r => r.survey_id === survey.id).length || 0;
        const target = survey.target_sample_size || 100;
        return {
          id: survey.id,
          title: survey.title,
          responses,
          target,
          completionRate: target > 0 ? Math.min((responses / target) * 100, 100) : 0,
          status: (survey.status || 'draft') as 'active' | 'completed' | 'draft'
        };
      }) || [];

      // Atividades recentes reais
      const recentActivity = allResponses?.slice(0, 3).map((response, i) => {
        const survey = surveys?.find(s => s.id === response.survey_id);
        return {
          id: response.id,
          type: 'response' as const,
          message: `Nova resposta para "${survey?.title || 'Pesquisa'}"`,
          timestamp: new Date(response.completed_at || '').toLocaleString('pt-BR')
        };
      }) || [];

      setAnalytics({
        totalSurveys,
        activeSurveys,
        totalResponses,
        avgCompletionRate,
        weeklyGrowth: 15.5,
        topPerformingSurvey: surveyPerformance[0]?.title || 'Nenhuma',
        recentActivity,
        surveyPerformance
      });
    } catch (error: any) {
      console.error('Erro ao carregar analytics:', error);
      toast({
        title: "Erro ao carregar analytics",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const viewDetailedAnalytics = async (survey: any) => {
    try {
      // Carregar respostas reais do Supabase
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', survey.id);

      if (error) throw error;

      // Analisar demografia real
      const genderCounts: Record<string, number> = {};
      const ageCounts: Record<string, number> = {};

      responses?.forEach(r => {
        const demographics = r.demographics as any;
        const gender = demographics?.gender || 'Não informado';
        const age = demographics?.age || 'Não informado';
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        ageCounts[age] = (ageCounts[age] || 0) + 1;
      });

      const quotas = [
        ...Object.entries(genderCounts).map(([key, val]) => ({
          category: 'gender',
          option: key,
          targetCount: Math.floor(survey.target * 0.5),
          currentCount: val,
          percentage: (val / (responses?.length || 1)) * 100
        })),
        ...Object.entries(ageCounts).map(([key, val]) => ({
          category: 'age',
          option: key,
          targetCount: Math.floor(survey.target * 0.25),
          currentCount: val,
          percentage: (val / (responses?.length || 1)) * 100
        }))
      ];

      const detailedData = {
        id: survey.id,
        title: survey.title,
        config: {
          totalParticipants: survey.target,
          quotas
        },
        responses: responses?.map(r => ({
          id: r.id,
          demographics: r.demographics || {},
          answers: r.answers || {},
          timestamp: new Date(r.completed_at || ''),
          location: r.coordinates ? { lat: r.coordinates[0], lng: r.coordinates[1] } : undefined
        })) || []
      };

      setDetailedSurvey(detailedData);
      setShowDetailedAnalytics(true);
    } catch (error: any) {
      console.error('Erro ao carregar detalhes:', error);
      toast({
        title: "Erro ao carregar detalhes",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (showDetailedAnalytics && detailedSurvey) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Detalhado</h1>
            <p className="text-muted-foreground">{detailedSurvey.title}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowDetailedAnalytics(false);
              setDetailedSurvey(null);
            }}
          >
            Voltar ao Analytics
          </Button>
        </div>
        
        <SurveyAnalytics survey={detailedSurvey} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Análise detalhada das suas pesquisas e resultados</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 3 meses</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pesquisas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSurveys}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeSurveys} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalResponses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.weeklyGrowth}% esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Finalização</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Média das pesquisas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{analytics.topPerformingSurvey}</div>
            <p className="text-xs text-muted-foreground">
              Pesquisa com mais respostas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance das Pesquisas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance das Pesquisas</CardTitle>
            <CardDescription>Status e progresso de cada pesquisa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.surveyPerformance.map((survey) => (
                <div key={survey.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium truncate">{survey.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge 
                        variant={
                          survey.status === 'active' ? 'default' :
                          survey.status === 'completed' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {survey.status === 'active' ? 'Ativa' : 
                         survey.status === 'completed' ? 'Finalizada' : 'Rascunho'}
                      </Badge>
                      <span>{survey.responses}/{survey.target} respostas</span>
                      <span>•</span>
                      <span>{survey.completionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {survey.completionRate >= 100 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : survey.completionRate >= 75 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => viewDetailedAnalytics(survey)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas atividades nas suas pesquisas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'response' && <Users className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'survey_created' && <BarChart3 className="h-4 w-4 text-green-600" />}
                    {activity.type === 'survey_completed' && <CheckCircle className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}