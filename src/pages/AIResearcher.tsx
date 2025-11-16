import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Lock, CheckCircle2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !survey) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
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

      const { data, error } = await supabase.functions.invoke('ai-multi-rotation', {
        body: {
          messages: conversationHistory,
          system_context: systemContext
        }
      });

      if (error) throw error;

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

    } catch (error) {
      console.error('Error sending message:', error);
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
      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey!.id,
          respondent_data: {
            user_id: user?.id,
            email: user?.email || responseData.email,
            name: responseData.name
          },
          answers: responseData.answers,
          demographics: responseData.demographics || {},
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Pesquisa concluída!",
        description: "Obrigado por participar da nossa pesquisa.",
      });

    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Erro ao salvar respostas",
        description: "Houve um problema ao salvar suas respostas.",
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
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua resposta..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isCompleted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Pesquisa Concluída!</h3>
                <p className="text-sm text-green-700">
                  Obrigado por participar. Suas respostas foram salvas com sucesso.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
