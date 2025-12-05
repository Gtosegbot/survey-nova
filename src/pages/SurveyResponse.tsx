import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, MapPin, Clock, Loader2, AlertTriangle } from "lucide-react";
import { useQuotaCheck } from "@/hooks/useQuotaCheck";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  questions: any;
  mandatory_questions: any;
  target_sample_size: number;
  current_responses: number;
  status: string;
}

export const SurveyResponse = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState("");
  const { checkQuota, incrementQuota } = useQuotaCheck();

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineResponses();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load survey from Supabase
  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId) return;

      try {
        // First try to find survey directly by ID (public or via link)
        let { data, error } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .single();

        // If not found by ID, try to find via survey_links table
        if (error || !data) {
          const { data: linkData } = await supabase
            .from('survey_links')
            .select('survey_id')
            .eq('link_id', surveyId)
            .single();

          if (linkData?.survey_id) {
            const { data: surveyData } = await supabase
              .from('surveys')
              .select('*')
              .eq('id', linkData.survey_id)
              .single();
            
            data = surveyData;
          }
        }

        if (!data) {
          throw new Error('Survey not found');
        }

        // Check if survey is accessible (not closed)
        if (data.status === 'closed') {
          throw new Error('Survey is closed');
        }

        setSurvey(data as Survey);
        subscribeToSurveyUpdates(data.id);
      } catch (error: any) {
        console.error('Error loading survey:', error);
        toast({
          title: "Pesquisa não encontrada",
          description: "A pesquisa que você está tentando acessar não existe ou não está disponível.",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    loadSurvey();
  }, [surveyId, navigate, toast]);

  // Subscribe to real-time survey updates
  const subscribeToSurveyUpdates = (id: string) => {
    const channel = supabase
      .channel('survey-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'surveys',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setSurvey(prev => prev ? { ...prev, ...payload.new } as Survey : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Sync offline responses when connection is restored
  const syncOfflineResponses = async () => {
    const offlineResponses = JSON.parse(localStorage.getItem('offline_responses') || '[]');
    
    for (const response of offlineResponses) {
      try {
        await submitResponseToSupabase(response);
      } catch (error) {
        console.error('Error syncing offline response:', error);
      }
    }
    
    if (offlineResponses.length > 0) {
      localStorage.removeItem('offline_responses');
      toast({
        title: "Sincronizado!",
        description: `${offlineResponses.length} resposta(s) enviada(s) com sucesso.`,
      });
    }
  };

  const submitResponseToSupabase = async (responseData: any) => {
    console.log('📤 Submitting survey response to database:', responseData);
    
    // Submit response
    const { data: savedResponse, error: responseError } = await supabase
      .from('survey_responses')
      .insert({
        survey_id: responseData.surveyId,
        respondent_data: responseData.respondentData || {},
        answers: responseData.responses,
        demographics: responseData.demographics || {},
        ip_address: responseData.ipAddress,
        user_agent: navigator.userAgent,
        is_valid: true,
        confidence_score: 1.0
      })
      .select()
      .single();

    if (responseError) {
      console.error('❌ Error saving response to database:', responseError);
      throw responseError;
    }

    console.log('✅ Response saved to database:', savedResponse);

    // Increment response count using the database function
    console.log('📊 Incrementing survey response counter...');
    const { error: updateError } = await supabase.rpc('increment_survey_responses', {
      survey_uuid: responseData.surveyId
    });

    if (updateError) {
      console.error('⚠️ Error incrementing counter:', updateError);
    } else {
      console.log('✅ Survey response counter incremented successfully');
    }

    return savedResponse;
  };

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando pesquisa...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mandatoryQuestions = survey.mandatory_questions ? 
    Object.entries(survey.mandatory_questions)
      .filter(([_, q]: [string, any]) => q.enabled)
      .map(([key, q]: [string, any]) => ({ ...q, id: key })) : [];
  
  const allQuestions = [...mandatoryQuestions, ...(Array.isArray(survey.questions) ? survey.questions : [])];
  const totalSteps = allQuestions.length + 2;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const completionPercentage = Math.round((survey.current_responses / survey.target_sample_size) * 100);

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitSurvey = async () => {
    console.log('📝 Starting survey submission...');
    setIsSubmitting(true);
    
    try {
      // Check quotas before submitting
      const quotaResult = await checkQuota(
        survey.id,
        responses['gender'],
        responses['age'] || responses['age_range'],
        responses['location']
      );

      if (!quotaResult.allowed) {
        setQuotaBlocked(true);
        const messages = Object.values(quotaResult.quotas)
          .filter((q: any) => q?.full)
          .map((q: any) => q?.message)
          .join(' ');
        setQuotaMessage(messages || 'Cota concluída. Pesquise outra cota.');
        setIsSubmitting(false);
        return;
      }

      const responseData = {
        surveyId: survey.id,
        responses,
        submittedAt: new Date().toISOString(),
        demographics: {
          gender: responses['gender'],
          age_range: responses['age'] || responses['age_range'],
          location: responses['location']
        },
        respondentData: {},
        ipAddress: null
      };

      console.log('📋 Response data prepared:', responseData);

      if (isOnline) {
        console.log('🌐 Online - Submitting to Supabase...');
        await submitResponseToSupabase(responseData);
        
        // Increment quota counts
        await incrementQuota(
          survey.id,
          responses['gender'],
          responses['age'] || responses['age_range'],
          responses['location']
        );
        
        toast({
          title: "✅ Obrigado!",
          description: "Sua resposta foi registrada com sucesso no banco de dados.",
        });

        console.log('✅ Survey submitted successfully');
        
        // Navigate to thank you step
        setCurrentStep(totalSteps - 1);
      } else {
        console.log('📴 Offline - Saving locally...');
        // Save offline
        const offlineResponses = JSON.parse(localStorage.getItem('offline_responses') || '[]');
        offlineResponses.push(responseData);
        localStorage.setItem('offline_responses', JSON.stringify(offlineResponses));
        
        toast({
          title: "💾 Salvo offline",
          description: "Sua resposta será enviada quando a conexão for restaurada.",
        });

        setCurrentStep(totalSteps - 1);
      }
    } catch (error: any) {
      console.error('❌ Error submitting survey:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Erro ao enviar resposta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: any, index: number) => {
    const questionId = question.id;
    const currentValue = responses[questionId] || '';

    return (
      <Card key={questionId} className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{index + 1} de {allQuestions.length}</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {!isOnline && (
                <Badge variant="destructive" className="mr-2">Offline</Badge>
              )}
              <Clock className="h-4 w-4" />
              ~2 min
            </div>
          </div>
          <CardTitle className="text-xl">{question.title || question.question}</CardTitle>
          {question.required && (
            <CardDescription>Esta pergunta é obrigatória</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {(question.type === 'text' || !question.options) && (
            <Textarea
              placeholder="Digite sua resposta..."
              value={currentValue}
              onChange={(e) => handleResponse(questionId, e.target.value)}
              className="min-h-[100px]"
            />
          )}
          
          {(question.type === 'single' || (question.options && !question.type)) && (
            <div className="space-y-2">
              {question.options.map((option: string, optionIndex: number) => (
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-accent transition-colors">
                  <input
                    type="radio"
                    name={questionId}
                    value={option}
                    checked={currentValue === option}
                    onChange={(e) => handleResponse(questionId, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {question.type === 'multiple' && (
            <div className="space-y-2">
              {question.options.map((option: string, optionIndex: number) => (
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-accent transition-colors">
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(currentValue) && currentValue.includes(option)}
                    onChange={(e) => {
                      const newValue = Array.isArray(currentValue) ? [...currentValue] : [];
                      if (e.target.checked) {
                        newValue.push(option);
                      } else {
                        const index = newValue.indexOf(option);
                        if (index > -1) newValue.splice(index, 1);
                      }
                      handleResponse(questionId, newValue);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {question.type === 'scale' && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Muito Ruim</span>
                <span>Muito Bom</span>
              </div>
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleResponse(questionId, value)}
                    className={`w-12 h-12 rounded-full border-2 font-semibold transition-colors ${
                      currentValue === value 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Intro screen
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{survey.title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {survey.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-accent/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso da Pesquisa</span>
                <span className="text-sm font-bold">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {survey.current_responses} de {survey.target_sample_size} respostas coletadas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-accent rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="font-semibold">~5 minutos</p>
                <p className="text-sm text-muted-foreground">Tempo estimado</p>
              </div>
              <div className="p-4 bg-accent rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="font-semibold">Anônimo</p>
                <p className="text-sm text-muted-foreground">Dados protegidos</p>
              </div>
              <div className="p-4 bg-accent rounded-lg">
                <MapPin className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="font-semibold">Offline</p>
                <p className="text-sm text-muted-foreground">Funciona sem internet</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button onClick={nextStep} size="lg" className="w-full md:w-auto">
                Começar Pesquisa
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion screen
  if (currentStep === totalSteps - 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Obrigado!</h1>
            <p className="text-muted-foreground mb-6">
              Sua participação foi registrada com sucesso. Suas respostas são muito importantes para nossa pesquisa.
            </p>
            
            <div className="bg-accent p-4 rounded-lg border mb-6">
              <p className="text-sm">
                <strong>Quer ajudar mais?</strong> Compartilhe esta pesquisa com seus amigos e familiares!
              </p>
            </div>
            
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-2xl mx-auto mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Progresso: {Math.round(progress)}%</span>
          <span>{currentStep} de {totalSteps - 1}</span>
        </div>
      </div>

      <div className="space-y-6">
        {renderQuestion(currentQuestion, currentStep - 1)}
      </div>

      <div className="max-w-2xl mx-auto mt-6 flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep <= 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        
        {currentStep === allQuestions.length ? (
          <Button 
            onClick={submitSurvey} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Finalizar Pesquisa
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={nextStep}>
            Próxima
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};