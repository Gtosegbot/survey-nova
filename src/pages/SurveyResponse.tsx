import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, MapPin, Clock } from "lucide-react";

interface Survey {
  id: string;
  title: string;
  description: string;
  mandatoryQuestions: any[];
  questions: any[];
  config: {
    totalParticipants: number;
    quotas: any[];
  };
}

export const SurveyResponse = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotaValidation, setQuotaValidation] = useState<{ valid: boolean; message: string }>({ valid: true, message: "" });

  useEffect(() => {
    // Simular carregamento da pesquisa
    const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    const foundSurvey = surveys.find((s: Survey) => s.id === surveyId);
    
    if (foundSurvey) {
      setSurvey(foundSurvey);
    } else {
      toast({
        title: "Pesquisa não encontrada",
        description: "A pesquisa que você está tentando acessar não existe.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [surveyId, navigate, toast]);

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Carregando pesquisa...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allQuestions = [...survey.mandatoryQuestions.filter(q => q.enabled), ...survey.questions];
  const totalSteps = allQuestions.length + 2; // +2 para intro e conclusão
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const validateQuota = () => {
    const demographics = {
      gender: responses['gender'],
      age: responses['age'],
      location: responses['location']
    };

    // Simular validação de cota
    const quotaFull = Math.random() > 0.8; // 20% chance de cota cheia
    
    if (quotaFull) {
      setQuotaValidation({
        valid: false,
        message: `Desculpe, a cota para o perfil ${demographics.gender}, ${demographics.age} em ${demographics.location} já foi preenchida. Compartilhe com alguém de perfil diferente para continuar coletando dados!`
      });
      return false;
    }
    
    setQuotaValidation({ valid: true, message: "" });
    return true;
  };

  const nextStep = () => {
    // Se estamos saindo das perguntas obrigatórias, validar cota
    if (currentStep === survey.mandatoryQuestions.filter(q => q.enabled).length - 1) {
      if (!validateQuota()) {
        return;
      }
    }
    
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
    setIsSubmitting(true);
    
    try {
      // Simular envio da resposta
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const responseData = {
        id: Date.now().toString(),
        surveyId: survey.id,
        responses,
        submittedAt: new Date(),
        demographics: {
          gender: responses['gender'],
          age: responses['age'],
          location: responses['location']
        }
      };

      // Salvar resposta no localStorage
      const existingResponses = JSON.parse(localStorage.getItem('survey_responses') || '[]');
      existingResponses.push(responseData);
      localStorage.setItem('survey_responses', JSON.stringify(existingResponses));

      toast({
        title: "Obrigado!",
        description: "Sua resposta foi enviada com sucesso.",
      });
      
      setCurrentStep(totalSteps - 1); // Ir para tela de conclusão
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta. Tente novamente.",
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
              <Clock className="h-4 w-4" />
              ~2 min restantes
            </div>
          </div>
          <CardTitle className="text-xl">{question.title}</CardTitle>
          {question.required && (
            <CardDescription>Esta pergunta é obrigatória</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {question.type === 'text' && (
            <Textarea
              placeholder="Digite sua resposta..."
              value={currentValue}
              onChange={(e) => handleResponse(questionId, e.target.value)}
              className="min-h-[100px]"
            />
          )}
          
          {(question.type === 'single' || question.category) && (
            <div className="space-y-2">
              {question.options.map((option: string, optionIndex: number) => (
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50">
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
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50">
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
                        : 'border-gray-300 hover:border-primary'
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

  // Tela de introdução
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{survey.title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {survey.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="font-semibold">~5 minutos</p>
                <p className="text-sm text-muted-foreground">Tempo estimado</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="font-semibold">Anônimo</p>
                <p className="text-sm text-muted-foreground">Dados protegidos</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <MapPin className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="font-semibold">Localização</p>
                <p className="text-sm text-muted-foreground">Opcional</p>
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

  // Tela de conclusão
  if (currentStep === totalSteps - 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Obrigado!</h1>
            <p className="text-muted-foreground mb-6">
              Sua participação foi registrada com sucesso. Suas respostas são muito importantes para nossa pesquisa.
            </p>
            
            <div className="bg-white p-4 rounded-lg border mb-6">
              <p className="text-sm text-muted-foreground">
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

  // Validação de cota falhou
  if (!quotaValidation.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="bg-yellow-100 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-bold text-yellow-800 mb-2">Cota Preenchida</h2>
              <p className="text-yellow-700">{quotaValidation.message}</p>
            </div>
            
            <Button onClick={() => navigate('/')} variant="outline">
              Entendi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Progresso: {Math.round(progress)}%</span>
          <span>{currentStep} de {totalSteps - 1}</span>
        </div>
      </div>

      {/* Question */}
      <div className="space-y-6">
        {renderQuestion(currentQuestion, currentStep - 1)}
      </div>

      {/* Navigation */}
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
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Enviando...' : 'Finalizar Pesquisa'}
            <CheckCircle className="ml-2 h-4 w-4" />
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