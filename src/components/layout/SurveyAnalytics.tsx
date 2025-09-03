import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react";

interface AnalyticsProps {
  survey: {
    id: string;
    title: string;
    config: {
      totalParticipants: number;
      quotas: Array<{
        category: string;
        option: string;
        targetCount: number;
        currentCount: number;
        percentage: number;
      }>;
    };
    responses?: Array<{
      id: string;
      demographics: Record<string, string>;
      answers: Record<string, any>;
      timestamp: Date;
      location?: { lat: number; lng: number };
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const SurveyAnalytics = ({ survey }: AnalyticsProps) => {
  const totalResponses = survey.responses?.length || 0;
  const completionRate = (totalResponses / survey.config.totalParticipants) * 100;
  
  const quotasFilled = survey.config.quotas.map(quota => ({
    ...quota,
    fillRate: (quota.currentCount / quota.targetCount) * 100,
    status: quota.currentCount >= quota.targetCount ? 'complete' : 
            quota.currentCount >= quota.targetCount * 0.8 ? 'warning' : 'active'
  }));

  const genderDistribution = survey.config.quotas
    .filter(q => q.category === 'gender')
    .map((quota, index) => ({
      name: quota.option,
      value: quota.currentCount,
      target: quota.targetCount,
      color: COLORS[index % COLORS.length]
    }));

  const ageDistribution = survey.config.quotas
    .filter(q => q.category === 'age')
    .map((quota, index) => ({
      name: quota.option,
      current: quota.currentCount,
      target: quota.targetCount
    }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Respostas</p>
                <p className="text-2xl font-bold">{totalResponses}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completionRate.toFixed(1)}% de {survey.config.totalParticipants}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{completionRate > 0 ? '68%' : '0%'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {totalResponses > 0 ? '+12% vs. última semana' : 'Aguardando respostas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">3:42</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground">min para completar</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cotas Completas</p>
                <p className="text-2xl font-bold">
                  {quotasFilled.filter(q => q.status === 'complete').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              de {quotasFilled.length} cotas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quota Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso das Cotas Demográficas</CardTitle>
          <CardDescription>
            Acompanhe o preenchimento das cotas em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotasFilled.map((quota, index) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(quota.status)}
                        <Badge variant="outline" className="text-xs">
                          {quota.category === 'gender' ? 'Sexo' : 
                           quota.category === 'age' ? 'Idade' : 'Localização'}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{quota.fillRate.toFixed(0)}%</span>
                    </div>
                    
                    <div>
                      <p className="font-medium text-sm">{quota.option}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Atual: {quota.currentCount}</span>
                        <span>Meta: {quota.targetCount}</span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(quota.fillRate, 100)} 
                      className="h-2"
                    />
                    
                    {quota.fillRate >= 100 && (
                      <Badge variant="default" className="text-xs bg-green-500">
                        ✅ Cota Completa
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Sexo</CardTitle>
            <CardDescription>Comparação atual vs. meta</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa Etária</CardTitle>
            <CardDescription>Atual vs. Meta por idade</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="current" fill="#8884d8" name="Atual" />
                <Bar dataKey="target" fill="#82ca9d" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Alerts */}
      {quotasFilled.some(q => q.status === 'complete') && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Cotas Preenchidas!</p>
                <p className="text-sm text-green-700">
                  {quotasFilled.filter(q => q.status === 'complete').map(q => q.option).join(', ')} 
                  {quotasFilled.filter(q => q.status === 'complete').length === 1 ? ' atingiu' : ' atingiram'} a meta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Recomendadas</CardTitle>
          <CardDescription>Sugestões para otimizar a coleta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quotasFilled.filter(q => q.fillRate < 50).map((quota, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    Foco em {quota.option}
                  </p>
                  <p className="text-sm text-blue-700">
                    Apenas {quota.currentCount} de {quota.targetCount} respostas coletadas. 
                    Considere expandir a distribuição para esse perfil.
                  </p>
                </div>
              </div>
            ))}
            
            {quotasFilled.every(q => q.fillRate >= 50) && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Ótimo progresso!</p>
                  <p className="text-sm text-green-700">
                    Todas as cotas estão com bom preenchimento. Continue assim!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};