import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BarChart3, Send, Eye, Pencil, Trash2, Copy, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Surveys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
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
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error: any) {
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
    survey.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'completed': return 'Concluída';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  const handleShare = async (survey: Survey) => {
    const shareLink = `${window.location.origin}/survey/${survey.id}`;
    await navigator.clipboard.writeText(shareLink);
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
        description: "A pesquisa foi removida com sucesso.",
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Pesquisas</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe suas pesquisas
          </p>
        </div>
        <Button onClick={() => navigate('/ai-creator')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pesquisa com IA
        </Button>
      </div>

      <div className="flex gap-2">
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

      {filteredSurveys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Nenhuma pesquisa encontrada" : "Você ainda não criou nenhuma pesquisa"}
            </p>
            <Button onClick={() => navigate('/ai-creator')}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Pesquisa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSurveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{survey.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {survey.description || "Sem descrição"}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(survey.status)}>
                    {getStatusText(survey.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Respostas</p>
                    <p className="font-medium">
                      {survey.current_responses}/{survey.target_sample_size}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Perguntas</p>
                    <p className="font-medium">
                      {Array.isArray(survey.questions) ? survey.questions.length : 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/analytics?survey=${survey.id}`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShare(survey)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dispatchers?survey=${survey.id}`)}>
                        <Send className="h-4 w-4 mr-2" />
                        Disparar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(survey.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
