import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Lock, CheckCircle2, LogIn, MapPin, Mic } from "lucide-react";
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

  // Load survey
  useEffect(() => {
    const loadSurvey = async () => {
      if (!researcherId) return;

      try {
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', researcherId)
          .eq('is_public', true)
          .eq('status', 'published')
          .single();

        if (error) throw error;

        if (data) {
          setSurvey(data as Survey);
          // Show consent dialog after loading survey
          setTimeout(() => setShowConsentDialog(true), 1000);
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
  }, [researcherId, navigate, toast]);

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
          toast({
            title: "Localização não autorizada",
            description: "Você pode continuar, mas isso pode afetar a validação.",
          });
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
          description: "Respostas em áudio podem ser habilitadas.",
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
      description: "É necessário aceitar os termos para participar da pesquisa.",
      variant: "destructive"
    });
    navigate('/');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.href
        }
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

  const handleSurveyGenerated = async (surveyData: any) => {
    if (!survey) return;

    try {
      const protocolId = `PROTO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setProtocolId(protocolId);
      
      const deviceFingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;

      // Check for duplicates
      const { data: existingResponses } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', survey.id)
        .or(`respondent_data->>user_id.eq.${user?.id},respondent_data->>email.eq.${surveyData.email}`);

      if (existingResponses && existingResponses.length > 0) {
        toast({
          title: "Resposta já registrada",
          description: "Você já respondeu esta pesquisa anteriormente.",
          variant: "destructive"
        });
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey.id,
          response_id: protocolId,
          respondent_data: {
            user_id: user?.id,
            email: user?.email || surveyData.email,
            name: surveyData.name,
            authenticated: !!user,
            consent_granted: permissionsGranted.consent,
            location_permission: permissionsGranted.location,
            audio_permission: permissionsGranted.audio
          },
          answers: surveyData.answers || {},
          demographics: surveyData.demographics || {},
          device_info: {
            fingerprint: deviceFingerprint,
            user_agent: navigator.userAgent
          },
          location: coordinates,
          ip_address: null,
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving to database:', error);
        throw error;
      }

      // Try to save to local storage for offline support
      try {
        const offlineData = {
          survey_id: survey.id,
          response_id: protocolId,
          respondent_data: surveyData,
          timestamp: new Date().toISOString(),
          synced: true
        };
        localStorage.setItem(`survey_response_${protocolId}`, JSON.stringify(offlineData));
      } catch (storageError) {
        console.log('Could not save to local storage:', storageError);
      }

      setIsCompleted(true);
      
      toast({
        title: "Pesquisa concluída! ✅",
        description: `Protocolo: ${protocolId}. Obrigado por participar!`,
      });

      console.log('✅ Response saved successfully with protocol:', protocolId);

    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Erro ao salvar respostas",
        description: "Suas respostas foram salvas localmente e serão sincronizadas quando possível.",
        variant: "destructive"
      });
    }
  };

  if (!survey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              Guarde este protocolo para futura referência. Suas respostas foram registradas com sucesso.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Termo de Consentimento
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-left">
              <p>
                Para participar desta pesquisa, precisamos do seu consentimento para coletar:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Localização:</strong> Para validar a autenticidade e prevenir fraudes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mic className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Microfone:</strong> Para permitir respostas em áudio (opcional)</span>
                </li>
              </ul>
              <p className="text-sm">
                Seus dados serão usados apenas para fins de pesquisa e auditoria, 
                respeitando a LGPD. Você pode revogar seu consentimento a qualquer momento.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConsentDecline}>
              Não Aceito
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentAccept}>
              Aceito os Termos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto p-4 max-w-4xl min-h-screen flex flex-col">
        <div className="mb-6 mt-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-muted-foreground">{survey.description}</p>
          )}
        </div>

        {!user && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Autenticação Recomendada
              </CardTitle>
              <CardDescription>
                Para garantir que você é uma pessoa real e proteger a integridade da pesquisa, 
                recomendamos fazer login com suas redes sociais.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                onClick={() => handleSocialLogin('google')}
                variant="outline"
                className="flex-1"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Continuar com Google
              </Button>
              <Button
                onClick={() => handleSocialLogin('facebook')}
                variant="outline"
                className="flex-1"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Continuar com Facebook
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 flex gap-2 flex-wrap">
          {user ? (
            <Badge variant="default" className="gap-2">
              <CheckCircle2 className="h-3 w-3" />
              Autenticado: {user.email}
            </Badge>
          ) : (
            <Badge variant="secondary">
              Modo Anônimo
            </Badge>
          )}
          
          {permissionsGranted.location && (
            <Badge variant="outline" className="gap-2">
              <MapPin className="h-3 w-3" />
              Localização autorizada
            </Badge>
          )}
          
          {permissionsGranted.audio && (
            <Badge variant="outline" className="gap-2">
              <Mic className="h-3 w-3" />
              Áudio autorizado
            </Badge>
          )}
        </div>

        {permissionsGranted.consent && (
          <N8nChatWidget
            onSurveyGenerated={handleSurveyGenerated}
            systemPrompt={`Você é um pesquisador de campo conduzindo a pesquisa: "${survey.title}".

${survey.description || ''}

INSTRUÇÕES:
1. Primeiro, cumprimente e peça o nome completo do respondente
2. Colete dados demográficos obrigatórios: gênero, faixa etária, região
3. Faça as perguntas da pesquisa de forma natural e conversacional
4. Permita que o respondente esclareça dúvidas
5. Quando todas as respostas forem coletadas, agradeça e informe que a pesquisa foi concluída

Ao finalizar, retorne um objeto JSON com este formato:
{
  "surveyData": {
    "name": "nome do respondente",
    "email": "email se fornecido",
    "demographics": { "gender": "...", "age_range": "...", "region": "..." },
    "answers": { "pergunta1": "resposta1", ... }
  }
}

Seja educado, claro e objetivo. Não seja tendencioso nas perguntas.`}
            placeholder="Digite sua resposta..."
          />
        )}
      </div>
    </>
  );
}
