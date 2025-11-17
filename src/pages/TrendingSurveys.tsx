import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, MessageCircle, BarChart3, Award, Globe } from "lucide-react";

interface TrendingSurvey {
  id: string;
  title: string;
  description: string;
  response_count: number;
  category: string;
  is_trending: boolean;
}

export default function TrendingSurveys() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<TrendingSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrendingSurveys();
  }, []);

  const loadTrendingSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('id, title, description, current_responses, methodology')
        .eq('is_public', true)
        .eq('status', 'published')
        .order('current_responses', { ascending: false })
        .limit(12);

      if (error) throw error;

      const trendingSurveys: TrendingSurvey[] = (data || []).map((survey, index) => ({
        id: survey.id,
        title: survey.title,
        description: survey.description || 'Dê sua opinião sobre este tema',
        response_count: survey.current_responses || 0,
        category: survey.methodology || 'Opinião Pública',
        is_trending: index < 3
      }));

      setSurveys(trendingSurveys);
    } catch (error: any) {
      console.error('Error loading surveys:', error);
      toast({
        title: "Erro ao carregar pesquisas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('política')) return Globe;
    if (category.toLowerCase().includes('mercado')) return BarChart3;
    if (category.toLowerCase().includes('satisfação')) return Award;
    return MessageCircle;
  };

  const getCategoryColor = (category: string) => {
    if (category.toLowerCase().includes('política')) return 'bg-blue-500';
    if (category.toLowerCase().includes('mercado')) return 'bg-green-500';
    if (category.toLowerCase().includes('satisfação')) return 'bg-purple-500';
    return 'bg-orange-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Pesquisas em Alta</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Participe das pesquisas mais populares do momento e contribua com sua opinião
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => {
            const CategoryIcon = getCategoryIcon(survey.category);
            const categoryColor = getCategoryColor(survey.category);

            return (
              <Card 
                key={survey.id} 
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  survey.is_trending ? 'border-primary border-2' : ''
                }`}
                onClick={() => navigate(`/research/${survey.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${categoryColor} bg-opacity-10`}>
                      <CategoryIcon className={`h-5 w-5 ${categoryColor.replace('bg-', 'text-')}`} />
                    </div>
                    {survey.is_trending && (
                      <Badge variant="default" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Em Alta
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{survey.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {survey.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{survey.response_count} respostas</span>
                    </div>
                    <Badge variant="secondary">{survey.category}</Badge>
                  </div>
                  <Button className="w-full" onClick={() => navigate(`/research/${survey.id}`)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Participar Agora
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && surveys.length === 0 && (
        <Card className="p-12 text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma pesquisa disponível</h3>
          <p className="text-muted-foreground mb-6">
            Seja o primeiro a criar uma pesquisa e compartilhar com a comunidade!
          </p>
          <Button onClick={() => navigate('/ai-creator')}>
            Criar Nova Pesquisa
          </Button>
        </Card>
      )}
    </div>
  );
}
