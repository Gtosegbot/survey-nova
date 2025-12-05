import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Lock, CheckCircle2, LogIn, MapPin, Mic, Sparkles, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { N8nChatWidget } from "@/components/N8nChatWidget";
import type { User } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  questions: any[];
  mandatory_questions: any;
}

export default function AIResearcher() {
  const { researcherId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [protocolId, setProtocolId] = useState<string>('');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState({ 
    location: false, 
    audio: false,
    consent: false 
  });
  const [coordinates, setCoordinates] = useState<string | null>(null);
  
  // Mode: 'respond' (answer existing survey) or 'create' (create new survey via AI)
  const [mode, setMode] = useState<'respond' | 'create'>('respond');
  const [surveyPrompt, setSurveyPrompt] = useState('');
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [createdSurvey, setCreatedSurvey] = useState<any>(null);

  // Check if we're in create mode
  useEffect(() => {
    if (!researcherId && searchParams.get('mode') === 'create') {
      setMode('create');
    }
  }, [researcherId, searchParams]);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load survey if responding to existing one
  useEffect(() => {
    const loadSurvey = async () => {
      if (!researcherId || mode === 'create') return;

      try {
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', researcherId)
          .single();

        if (error) throw error;

        if (data) {
          setSurvey(data as Survey);
          setTimeout(() => setShowConsentDialog(true), 500);
        }
      } catch (error) {
        console.error('Error loading survey:', error);
        toast({
          title: "Pesquisa não encontrada",
          description: "Esta pesquisa não está disponível ou não existe.",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    loadSurvey();
  }, [researcherId, navigate, toast, mode]);

  const handleConsentAccept = async () => {
    setPermissionsGranted(prev => ({ ...prev, consent: true }));
    setShowConsentDialog(false);
    
    // Request location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `POINT(${position.coords.longitude} ${position.coords.latitude})`;
          setCoordinates(coords);
          setPermissionsGranted(prev => ({ ...prev, location: true }));
          toast({
            title: "Localização autorizada ✓",
            description: "Isso ajuda a validar a autenticidade das respostas.",
          });
        },
        (error) => {
          console.log('Location permission denied:', error);
        }
      );
    }

    // Request microphone
    if ('mediaDevices' in navigator) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionsGranted(prev => ({ ...prev, audio: true }));
        toast({
          title: "Áudio autorizado ✓",
          description: "Você pode responder por voz.",
        });
      } catch (error) {
        console.log('Audio permission denied:', error);
      }
    }
  };

  const handleConsentDecline = () => {
    setShowConsentDialog(false);
    toast({
      title: "Consentimento necessário",
      description: "É necessário aceitar os termos para participar.",
      variant: "destructive"
    });
    navigate('/');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.href }
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleCreateSurveyFromPrompt = async () => {
    if (!surveyPrompt.trim() || !user) {
      toast({
        title: "Atenção",
        description: "Faça login e descreva a pesquisa que deseja criar.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingSurvey(true);
    
    try {
      // Call edge function to generate survey via Lovable AI
      const { data, error } = await supabase.functions.invoke('ai-survey-creator', {
        body: {
          prompt: surveyPrompt,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data?.survey) {
        setCreatedSurvey(data.survey);
        toast({
          title: "Pesquisa criada! ✨",
          description: "Agora você pode revisar e publicar sua pesquisa.",
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating survey:', error);
      toast({
        title: "Erro ao criar pesquisa",
        description: error instanceof Error ? error.message : "Tente descrever sua pesquisa de outra forma.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSurvey(false);
    }
  };

  const handleSurveyGenerated = async (surveyData: any) => {
    if (!survey && mode !== 'create') return;

    try {
      const newProtocolId = `PROTO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setProtocolId(newProtocolId);
      
      const deviceFingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;

      // Check for duplicates
      if (survey) {
        const { data: existingResponses } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('survey_id', survey.id)
          .or(`respondent_data->>user_id.eq.${user?.id},respondent_data->>email.eq.${surveyData.email || ''}`);

        if (existingResponses && existingResponses.length > 0) {
          toast({
            title: "Resposta já registrada",
            description: "Você já respondeu esta pesquisa anteriormente.",
            variant: "destructive"
          });
          return;
        }
      }

      // Save response
      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey?.id || createdSurvey?.id,
          response_id: newProtocolId,
          respondent_data: {
            user_id: user?.id,
            email: user?.email || surveyData.email,
            name: surveyData.name,
            authenticated: !!user,
            consent_granted: permissionsGranted.consent,
            location_permission: permissionsGranted.location,
            audio_permission: permissionsGranted.audio,
            conversation_history: surveyData.conversationHistory
          },
          answers: surveyData.answers || {},
          demographics: surveyData.demographics || {},
          device_info: {
            fingerprint: deviceFingerprint,
            user_agent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`
          },
          location: coordinates,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Increment survey response count
      if (survey?.id) {
        await supabase.rpc('increment_survey_responses', { survey_uuid: survey.id });
      }

      // Save to localStorage for offline backup
      try {
        localStorage.setItem(`survey_response_${newProtocolId}`, JSON.stringify({
          survey_id: survey?.id,
          response_id: newProtocolId,
          data: surveyData,
          timestamp: new Date().toISOString(),
          synced: true
        }));
      } catch (e) {
        console.log('LocalStorage not available');
      }

      setIsCompleted(true);
      
      toast({
        title: "Pesquisa concluída! ✅",
        description: `Protocolo: ${newProtocolId}`,
      });

    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Erro ao salvar",
        description: "Suas respostas foram salvas localmente.",
        variant: "destructive"
      });
    }
  };

  const saveSurveyToDatabase = async () => {
    if (!createdSurvey || !user) return;

    try {
      const { data, error } = await supabase
        .from('surveys')
        .insert({
          user_id: user.id,
          title: createdSurvey.title,
          description: createdSurvey.description,
          questions: createdSurvey.questions || [],
          mandatory_questions: createdSurvey.mandatory_questions || {},
          status: 'draft',
          target_sample_size: createdSurvey.target_sample_size || 100
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Pesquisa salva!",
        description: "Você pode editá-la em 'Minhas Pesquisas'.",
      });

      navigate('/my-surveys');
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Create mode UI
  if (mode === 'create') {
    return (
      <div className="container mx-auto p-4 max-w-4xl min-h-screen">
        <div className="mb-6 mt-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            IA Pesquisadora - Criar Pesquisa
          </h1>
          <p className="text-muted-foreground">
            Descreva sua pesquisa em linguagem natural e a IA vai criar as perguntas.
          </p>
        </div>

        {!user ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Faça login para criar pesquisas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => handleSocialLogin('google')} variant="outline" className="flex-1">
                <LogIn className="h-4 w-4 mr-2" /> Google
              </Button>
              <Button onClick={() => handleSocialLogin('facebook')} variant="outline" className="flex-1">
                <LogIn className="h-4 w-4 mr-2" /> Facebook
              </Button>
            </CardContent>
          </Card>
        ) : createdSurvey ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Pesquisa Criada: {createdSurvey.title}
              </CardTitle>
              <CardDescription>{createdSurvey.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Perguntas geradas:</h4>
                <ul className="space-y-2">
                  {createdSurvey.questions?.map((q: any, i: number) => (
                    <li key={i} className="text-sm">
                      {i + 1}. {q.text || q.question}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3">
                <Button onClick={saveSurveyToDatabase} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Salvar Pesquisa
                </Button>
                <Button variant="outline" onClick={() => setCreatedSurvey(null)}>
                  Criar Outra
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Descreva sua pesquisa aqui...&#10;&#10;Exemplo: Quero criar uma pesquisa sobre satisfação do cliente para um restaurante, focando em qualidade da comida, atendimento, tempo de espera e ambiente. O público-alvo são clientes que visitaram o restaurante nos últimos 30 dias."
                value={surveyPrompt}
                onChange={(e) => setSurveyPrompt(e.target.value)}
                className="min-h-[200px]"
              />
              <Button 
                onClick={handleCreateSurveyFromPrompt} 
                disabled={isCreatingSurvey || !surveyPrompt.trim()}
                className="w-full"
              >
                {isCreatingSurvey ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando pesquisa...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Criar Pesquisa com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Loading state
  if (!survey && mode === 'respond') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Completed state
  if (isCompleted && protocolId) {
    return (
      <div className="container mx-auto p-4 max-w-2xl min-h-screen flex items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Pesquisa Concluída!</CardTitle>
            <CardDescription>Obrigado por participar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Protocolo de Resposta</p>
              <p className="text-lg font-mono font-bold">{protocolId}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Guarde este protocolo para futura referência.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main survey response UI
  return (
    <>
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Termo de Consentimento (LGPD)
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-left">
              <p>Para participar desta pesquisa, precisamos do seu consentimento para coletar:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Localização:</strong> Para validar autenticidade e prevenir fraudes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mic className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Microfone:</strong> Para respostas em áudio (opcional)</span>
                </li>
              </ul>
              <p className="text-sm">
                Seus dados serão usados apenas para fins de pesquisa, respeitando a LGPD.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConsentDecline}>Não Aceito</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentAccept}>Aceito os Termos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto p-4 max-w-4xl min-h-screen flex flex-col">
        <div className="mb-6 mt-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            {survey?.title || 'Pesquisa'}
          </h1>
          {survey?.description && (
            <p className="text-muted-foreground">{survey.description}</p>
          )}
        </div>

        {!user && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Login Recomendado
              </CardTitle>
              <CardDescription>
                Para garantir a autenticidade da pesquisa, recomendamos fazer login.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => handleSocialLogin('google')} variant="outline" className="flex-1">
                <LogIn className="h-4 w-4 mr-2" /> Google
              </Button>
              <Button onClick={() => handleSocialLogin('facebook')} variant="outline" className="flex-1">
                <LogIn className="h-4 w-4 mr-2" /> Facebook
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 flex gap-2 flex-wrap">
          {user ? (
            <Badge variant="default" className="gap-2">
              <CheckCircle2 className="h-3 w-3" /> {user.email}
            </Badge>
          ) : (
            <Badge variant="secondary">Modo Anônimo</Badge>
          )}
          {permissionsGranted.location && (
            <Badge variant="outline" className="gap-2">
              <MapPin className="h-3 w-3" /> Localização ✓
            </Badge>
          )}
          {permissionsGranted.audio && (
            <Badge variant="outline" className="gap-2">
              <Mic className="h-3 w-3" /> Áudio ✓
            </Badge>
          )}
        </div>

        {permissionsGranted.consent && survey && (
          <N8nChatWidget
            mode="researcher"
            onSurveyGenerated={handleSurveyGenerated}
            surveyContext={{
              surveyId: survey.id,
              title: survey.title,
              description: survey.description,
              questions: survey.questions,
              mandatoryQuestions: survey.mandatory_questions
            }}
            systemPrompt={`Você é uma entrevistadora de campo profissional conduzindo a pesquisa: "${survey.title}".

${survey.description || ''}

INSTRUÇÕES IMPORTANTES:
1. Cumprimente o respondente e peça seu nome completo
2. Colete dados demográficos: gênero, idade, região/cidade
3. Faça as perguntas da pesquisa de forma conversacional e natural
4. Permita esclarecimentos quando solicitado
5. NÃO seja tendenciosa - apresente opções de forma neutra
6. Ao finalizar TODAS as perguntas, agradeça e retorne os dados coletados

Perguntas da pesquisa:
${JSON.stringify(survey.questions, null, 2)}

Ao concluir, envie um JSON com este formato:
{
  "surveyData": {
    "name": "nome do respondente",
    "demographics": { "gender": "...", "age_range": "...", "region": "..." },
    "answers": { "pergunta1": "resposta1", ... }
  }
}

Seja educada, profissional e objetiva.`}
            placeholder="Digite sua resposta..."
          />
        )}
      </div>
    </>
  );
}
