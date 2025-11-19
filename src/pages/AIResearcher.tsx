import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Lock, CheckCircle2, LogIn, Share2, Mic, MicOff, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { User } from '@supabase/supabase-js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [collectedResponses, setCollectedResponses] = useState<Record<string, any>>({});
  const [protocolId, setProtocolId] = useState<string>('');
  const [permissionsGranted, setPermissionsGranted] = useState({ location: false, audio: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { 
    isRecording, 
    audioUrl, 
    isUploading, 
    startRecording, 
    stopRecording, 
    uploadAudio, 
    clearAudio 
  } = useAudioRecorder();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Request permissions
  const requestPermissions = async () => {
    try {
      // Request geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setPermissionsGranted(prev => ({ ...prev, location: true }));
            toast({
              title: "Localização autorizada ✓",
              description: "Isso ajuda a validar a autenticidade das respostas.",
            });
          },
          () => {
            toast({
              title: "Localização não autorizada",
              description: "Você pode continuar, mas isso pode afetar a validação.",
              variant: "destructive"
            });
          }
        );
      }

      // Request microphone (audio)
      if ('mediaDevices' in navigator) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Stop immediately
          setPermissionsGranted(prev => ({ ...prev, audio: true }));
          toast({
            title: "Áudio autorizado ✓",
            description: "Isso permite futuras respostas em áudio para maior precisão.",
          });
        } catch {
          toast({
            title: "Áudio não autorizado",
            description: "Você pode continuar respondendo por texto.",
          });
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  useEffect(() => {
    if (survey && !permissionsGranted.location && !permissionsGranted.audio) {
      // Request permissions after survey loads
      const timer = setTimeout(() => {
        requestPermissions();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [survey]);

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
          const greeting: Message = {
            role: 'assistant',
            content: `Olá! Bem-vindo à pesquisa: **${data.title}**

${data.description || 'Vou fazer algumas perguntas para você.'}

Para começar, preciso que você se identifique. Por favor, forneça seu **nome completo**.`,
            timestamp: new Date()
          };
          setMessages([greeting]);
        }
      } catch (error: any) {
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

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.href
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend || isLoading || !survey) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const systemContext = {
        survey_id: survey.id,
        survey_title: survey.title,
        questions: survey.questions,
        mandatory_questions: survey.mandatory_questions,
        collected_responses: collectedResponses
      };

      console.log('📤 Sending to ai-multi-rotation:', { 
        messages: conversationHistory.slice(-5), // Only log last 5 messages
        systemContext 
      });

      const { data, error } = await supabase.functions.invoke('ai-multi-rotation', {
        body: {
          messages: conversationHistory,
          system_context: systemContext
        }
      });

      console.log('📥 Response received:', { 
        hasData: !!data, 
        hasResponse: !!data?.response,
        error 
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (!data || !data.response) {
        console.error('❌ Invalid response:', data);
        throw new Error('Resposta inválida da IA');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.survey_complete) {
        setIsCompleted(true);
        await saveSurveyResponse(data.collected_data);
      } else if (data.collected_data) {
        setCollectedResponses(prev => ({ ...prev, ...data.collected_data }));
      }

    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Desculpe, houve um erro: ${error.message || 'Tente novamente.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSurveyResponse = async (responseData: any) => {
    try {
      // Generate protocol ID
      const protocolId = `PROTO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setProtocolId(protocolId);
      
      // Get device fingerprint
      const deviceFingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;
      
      // Get geolocation if available
      let coordinates = null;
      if (permissionsGranted.location && 'geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          coordinates = `POINT(${position.coords.longitude} ${position.coords.latitude})`;
        } catch (error) {
          console.log('Could not get geolocation:', error);
        }
      }
      
      // Check for duplicates
      const { data: existingResponses } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', survey!.id)
        .or(`respondent_data->>user_id.eq.${user?.id},respondent_data->>email.eq.${responseData.email}`);

      if (existingResponses && existingResponses.length > 0) {
        toast({
          title: "Resposta já registrada",
          description: "Você já respondeu esta pesquisa anteriormente.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey!.id,
          response_id: protocolId,
          respondent_data: {
            user_id: user?.id,
            email: user?.email || responseData.email,
            name: responseData.name,
            authenticated: !!user
          },
          answers: responseData.answers,
          demographics: responseData.demographics || {},
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

      console.log('✅ Response saved successfully with protocol:', protocolId);

      toast({
        title: "Pesquisa concluída! ✅",
        description: `Protocolo: ${protocolId}. Obrigado por participar!`,
      });

    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Erro ao salvar respostas",
        description: "Houve um problema ao salvar suas respostas. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSendWithAudio = async () => {
    if (audioUrl && user && survey) {
      try {
        const cloudinaryUrl = await uploadAudio(survey.id, user.id);
        
        // Send message with audio reference
        await sendMessage(`[Áudio enviado: ${cloudinaryUrl}] ${inputMessage}`);
        clearAudio();
      } catch (error) {
        console.error('Error sending audio:', error);
      }
    } else {
      sendMessage();
    }
  };

  if (!survey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
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

      <div className="mb-4">
        {user ? (
          <Badge variant="default" className="gap-2">
            <CheckCircle2 className="h-3 w-3" />
            Autenticado como {user.email}
          </Badge>
        ) : (
          <Badge variant="secondary">
            Modo Anônimo - Autenticação recomendada
          </Badge>
        )}
      </div>

      <Card className="flex-1 flex flex-col mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Conversa da Pesquisa</span>
            {isCompleted && (
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="h-3 w-3" />
                Concluído
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Responda as perguntas de forma natural. A IA conduzirá a conversa.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 min-h-[400px]">
          <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'Você' : 'Assistente'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {!isCompleted && (
            <>
            {audioUrl && (
              <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg mb-2">
                <audio src={audioUrl} controls className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearAudio}
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isCompleted}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              <Input
                placeholder="Digite sua mensagem..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isCompleted}
                className="flex-1"
              />
              
              <Button
                onClick={handleSendWithAudio}
                disabled={isLoading || (!inputMessage.trim() && !audioUrl) || isCompleted || isUploading}
                size="icon"
              >
                {isLoading || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {isCompleted && protocolId && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Pesquisa Concluída!</h3>
                <p className="text-sm text-green-700">
                  Obrigado por participar. Suas respostas foram salvas com sucesso.
                </p>
                <p className="text-sm text-green-800 font-mono mt-2">
                  Protocolo: <strong>{protocolId}</strong>
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-green-200">
              <Button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/research/${survey.id}?ref=${user?.id || 'anonymous'}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: "Link copiado!",
                    description: "Compartilhe esta pesquisa com amigos e familiares.",
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Compartilhar com Amigos
              </Button>
              <Button
                onClick={() => navigate('/trending')}
                variant="default"
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ver Mais Pesquisas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
