import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Brain,
  FileText,
  Clock,
  CheckCircle
} from "lucide-react";

const stats = [
  {
    title: "Pesquisas Ativas",
    value: "12",
    change: "+2 esta semana",
    icon: FileText,
    color: "text-blue-600"
  },
  {
    title: "Respostas Coletadas",
    value: "2,847",
    change: "+18% vs. mês anterior",
    icon: Users,
    color: "text-green-600"
  },
  {
    title: "Taxa de Conversão",
    value: "68%",
    change: "+5% vs. mês anterior",
    icon: TrendingUp,
    color: "text-purple-600"
  },
  {
    title: "Créditos Restantes",
    value: "R$ 156,80",
    change: "Último uso: hoje",
    icon: BarChart3,
    color: "text-orange-600"
  }
];

const recentSurveys = [
  {
    title: "Pesquisa de Satisfação - Cliente X",
    status: "Ativa",
    responses: 247,
    target: 500,
    created: "há 2 dias"
  },
  {
    title: "Intenção de Voto - Eleições 2024",
    status: "Concluída",
    responses: 1200,
    target: 1200,
    created: "há 1 semana"
  },
  {
    title: "Pesquisa de Mercado - Produto Y",
    status: "Rascunho",
    responses: 0,
    target: 300,
    created: "há 3 dias"
  }
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas pesquisas e métricas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/ai-creator'}>
            <Brain className="mr-2 h-4 w-4" />
            Criar com IA
          </Button>
          <Button onClick={() => window.location.href = '/surveys'}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Pesquisa
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Surveys */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pesquisas Recentes</CardTitle>
            <CardDescription>
              Suas pesquisas mais recentes e o status atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSurveys.map((survey, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{survey.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge 
                        variant={
                          survey.status === 'Ativa' ? 'default' :
                          survey.status === 'Concluída' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {survey.status}
                      </Badge>
                      <span>{survey.responses}/{survey.target} respostas</span>
                      <span>•</span>
                      <span>{survey.created}</span>
                    </div>
                  </div>
                  {survey.status === 'Concluída' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : survey.status === 'Ativa' ? (
                    <Clock className="h-5 w-5 text-blue-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse as funcionalidades mais utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/surveys'}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Nova Pesquisa
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/ai-creator'}>
              <Brain className="mr-2 h-4 w-4" />
              Assistente IA
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/analytics'}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/team'}>
              <Users className="mr-2 h-4 w-4" />
              Gerenciar Equipe
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}