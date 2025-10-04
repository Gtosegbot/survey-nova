import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  TrendingUp,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  current_responses: number;
  target_sample_size: number;
  questions: any;
}

export default function MySurveys() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSurveys();
    }
  }, [user]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 Loaded surveys:', data);
      setSurveys(data || []);
    } catch (error: any) {
      console.error('❌ Error loading surveys:', error);
      toast({
        title: "Erro ao carregar pesquisas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'active': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
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

  const handleDelete = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) throw error;

      setSurveys(surveys.filter(s => s.id !== surveyId));
      toast({
        title: "Pesquisa excluída",
        description: "A pesquisa foi excluída com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando pesquisas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Pesquisas</h1>
          <p className="text-muted-foreground">Gerencie suas pesquisas criadas</p>
        </div>
        <Button onClick={() => navigate('/ai-creator')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pesquisa com IA
        </Button>
      </div>

      {/* Search */}
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
      </div>

      {/* Survey List */}
      <div className="grid gap-4">
        {filteredSurveys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground mb-4">
                {searchTerm ? 'Nenhuma pesquisa encontrada.' : 'Você ainda não criou nenhuma pesquisa.'}
              </div>
              {!searchTerm && (
                <Button onClick={() => navigate('/ai-creator')}>
                  <Plus className="mr-2 h-4 w-4" />
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
                    <CardDescription>{survey.description || 'Sem descrição'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(survey.status)}>
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
                        <DropdownMenuItem onClick={() => window.open(`/survey/${survey.id}`, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/analytics?survey=${survey.id}`)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
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
                    <span>Criada em: {new Date(survey.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {survey.current_responses || 0}/{survey.target_sample_size} respostas
                    </span>
                    <span>{Array.isArray(survey.questions) ? survey.questions.length : 0} perguntas</span>
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
