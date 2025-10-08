import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreateSurveyForm } from "@/components/sections/CreateSurveyForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function CreateSurvey() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [surveyData, setSurveyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (editId) {
      loadSurveyData(editId);
    }
  }, [editId]);

  const loadSurveyData = async (surveyId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (error) throw error;

      setSurveyData(data);
    } catch (error: any) {
      console.error('Erro ao carregar pesquisa:', error);
      toast({
        title: "Erro ao carregar pesquisa",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {editId ? 'Editar Pesquisa' : 'Criar Pesquisa Manualmente'}
        </h1>
        <p className="text-muted-foreground">
          {editId ? 'Edite os detalhes da sua pesquisa' : 'Configure sua pesquisa personalizada com controle total'}
        </p>
      </div>
      {isLoading ? (
        <div className="text-center p-8">Carregando...</div>
      ) : (
        <CreateSurveyForm initialData={surveyData} isEditing={!!editId} />
      )}
    </div>
  );
}
