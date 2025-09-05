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
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedSurvey, setSelectedSurvey] = useState<string>("all");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  const [detailedSurvey, setDetailedSurvey] = useState<any>(null);

  useEffect(() => {
    // Carregar dados de analytics
    loadAnalytics();
  }, [timeRange, selectedSurvey]);

  const loadAnalytics = () => {
    // Carregar pesquisas do localStorage
    const savedSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    const savedResponses = JSON.parse(localStorage.getItem('survey_responses') || '[]');

    // Calcular métricas
    const totalSurveys = savedSurveys.length;
    const activeSurveys = savedSurveys.filter((s: any) => s.status === 'active').length;
    const totalResponses = savedResponses.length;
    const avgCompletionRate = totalSurveys > 0 ? (totalResponses / (totalSurveys * 100)) * 100 : 0;

    // Simular dados de performance
    const surveyPerformance = savedSurveys.map((survey: any) => {
      const responses = Math.floor(Math.random() * 200);
      const target = survey.config?.totalParticipants || 100;
      return {
        id: survey.id,
        title: survey.title,
        responses,
        target,
        completionRate: target > 0 ? Math.min((responses / target) * 100, 100) : 0,
        status: survey.status
      };
    });

    const recentActivity = [
      {
        id: '1',
        type: 'response' as const,
        message: 'Nova resposta recebida para "Pesquisa de Satisfação"',
        timestamp: '5 min atrás'
      },
      {
        id: '2',
        type: 'survey_created' as const,
        message: 'Pesquisa "Intenção de Voto" foi criada',
        timestamp: '2 horas atrás'
      },
      {
        id: '3',
        type: 'survey_completed' as const,
        message: 'Pesquisa "Mercado Imobiliário" atingiu 100% das respostas',
        timestamp: '1 dia atrás'
      }
    ];

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
  };

  const viewDetailedAnalytics = (survey: any) => {
    // Gerar dados detalhados da pesquisa
    const detailedData = {
      id: survey.id,
      title: survey.title,
      config: {
        totalParticipants: survey.target,
        quotas: [
          { category: 'gender', option: 'Masculino', targetCount: Math.floor(survey.target * 0.5), currentCount: Math.floor(survey.responses * 0.45), percentage: 45 },
          { category: 'gender', option: 'Feminino', targetCount: Math.floor(survey.target * 0.5), currentCount: Math.floor(survey.responses * 0.55), percentage: 55 },
          { category: 'age', option: '25-34', targetCount: Math.floor(survey.target * 0.3), currentCount: Math.floor(survey.responses * 0.35), percentage: 35 },
          { category: 'age', option: '35-44', targetCount: Math.floor(survey.target * 0.3), currentCount: Math.floor(survey.responses * 0.25), percentage: 25 },
        ]
      },
      responses: Array.from({ length: survey.responses }, (_, i) => ({
        id: `response_${i}`,
        demographics: {
          gender: Math.random() > 0.5 ? 'Masculino' : 'Feminino',
          age: ['25-34', '35-44', '45-54'][Math.floor(Math.random() * 3)],
          location: 'São Paulo'
        },
        answers: {},
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        location: { lat: -23.5505, lng: -46.6333 }
      }))
    };

    setDetailedSurvey(detailedData);
    setShowDetailedAnalytics(true);
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