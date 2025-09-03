import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MoreVertical, 
  Search, 
  Share2, 
  Eye, 
  Edit,
  Trash2,
  QrCode,
  Download,
  Users,
  BarChart3,
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { SurveyAnalytics } from "@/components/layout/SurveyAnalytics";

interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  responseCount?: number;
  mandatoryQuestions: any[];
  questions: any[];
  config?: {
    totalParticipants: number;
    quotas: Array<{
      category: string;
      option: string;
      targetCount: number;
      currentCount: number;
      percentage: number;
    }>;
  };
}

interface SurveyWithResponses {
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
  responses: Array<{
    id: string;
    demographics: Record<string, string>;
    answers: Record<string, any>;
    timestamp: Date;
    location?: { lat: number; lng: number };
  }>;
}

export default function MySurveys() {
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyWithResponses | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    // Carregar pesquisas do localStorage
    const savedSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    setSurveys(savedSurveys);
  }, []);

  const viewAnalytics = (survey: Survey) => {
    // Simular dados de respostas para demonstração
    const surveyWithData: SurveyWithResponses = {
      ...survey,
      config: survey.config || { totalParticipants: 100, quotas: [] },
      responses: generateMockResponses(survey)
    };
    
    setSelectedSurvey(surveyWithData);
    setShowAnalytics(true);
  };

  const generateMockResponses = (survey: Survey) => {
    const responses = [];
    const totalResponses = Math.floor(Math.random() * (survey.config?.totalParticipants || 100) * 0.8) || Math.floor(Math.random() * 50);
    
    for (let i = 0; i < totalResponses; i++) {
      responses.push({
        id: `response_${i}`,
        demographics: {
          gender: ['Masculino', 'Feminino'][Math.floor(Math.random() * 2)],
          age: ['16-24', '25-34', '35-44', '45-59', '60+'][Math.floor(Math.random() * 5)],
          location: ['São Paulo Capital', 'Interior SP', 'Rio de Janeiro'][Math.floor(Math.random() * 3)]
        },
        answers: {},
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }
    
    // Atualizar cotas com dados simulados
    if (survey.config?.quotas) {
      survey.config.quotas.forEach(quota => {
        quota.currentCount = responses.filter(r => 
          r.demographics[quota.category as keyof typeof r.demographics] === quota.option
        ).length;
      });
    }
    
    return responses;
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'active': return 'Ativa';
      case 'completed': return 'Finalizada';
      default: return 'Desconhecido';
    }
  };

  const handleShare = (survey: Survey) => {
    const shareUrl = `${window.location.origin}/survey/${survey.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copiado!",
      description: "O link da pesquisa foi copiado para a área de transferência.",
    });
  };

  const handleQRCode = (survey: Survey) => {
    toast({
      title: "QR Code",
      description: "Funcionalidade de QR Code em desenvolvimento.",
    });
  };

  const handleDelete = (surveyId: string) => {
    const updatedSurveys = surveys.filter(s => s.id !== surveyId);
    setSurveys(updatedSurveys);
    localStorage.setItem('surveys', JSON.stringify(updatedSurveys));
    toast({
      title: "Pesquisa excluída",
      description: "A pesquisa foi excluída com sucesso.",
    });
  };

  if (showAnalytics && selectedSurvey) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics da Pesquisa</h1>
            <p className="text-muted-foreground">{selectedSurvey.title}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowAnalytics(false);
              setSelectedSurvey(null);
            }}
          >
            Voltar às Pesquisas
          </Button>
        </div>
        
        <SurveyAnalytics survey={selectedSurvey} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Minhas Pesquisas</h1>
        <p className="text-muted-foreground">Gerencie suas pesquisas criadas</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pesquisas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => window.location.href = '/surveys'}>
          Nova Pesquisa
        </Button>
      </div>

      {/* Survey List */}
      <div className="grid gap-4">
        {filteredSurveys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? 'Nenhuma pesquisa encontrada.' : 'Você ainda não criou nenhuma pesquisa.'}
              </div>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={() => window.location.href = '/surveys'}
                >
                  Criar Primeira Pesquisa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSurveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{survey.title}</CardTitle>
                    <CardDescription>{survey.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(survey.status)}>
                      {getStatusText(survey.status)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare(survey)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Compartilhar Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQRCode(survey)}>
                          <QrCode className="mr-2 h-4 w-4" />
                          Gerar QR Code
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => viewAnalytics(survey)}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Dados
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(survey.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span>Criada em: {new Date(survey.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {survey.responseCount || 0} respostas
                    </span>
                    <span>{survey.mandatoryQuestions.filter(q => q.enabled).length + survey.questions.length} perguntas</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleShare(survey)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}