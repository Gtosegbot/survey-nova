import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Send,
  User,
  Bot,
  Loader2,
  Lightbulb,
  Target,
  Users,
  BarChart3,
  FileText,
  CheckCircle,
  Clock
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface SurveyContext {
  theme?: string;
  objective?: string;
  targetAudience?: string;
  sampleSize?: number;
  ageRanges?: string[];
  methodology?: string;
  location?: string;
  specificQuestions?: string[];
  candidates?: string[];
  readyToCreate?: boolean;
}

interface SurveyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  icon: React.ComponentType<any>;
}

export default function AICreator() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Olá! Sou sua IA especialista em metodologia de pesquisa. Vou te ajudar a criar uma pesquisa completa e estatisticamente válida.\n\n📝 **Primeira etapa**: Preciso que você me descreva em um **prompt detalhado** tudo que você quer saber na pesquisa.\n\nPor favor, inclua:\n✅ Tema da pesquisa\n✅ Quem deve responder (público-alvo)\n✅ Onde será aplicada (localização)\n✅ Quantas pessoas (tamanho da amostra)\n✅ Perguntas específicas que quer fazer\n✅ Como será aplicada (presencial, online, telefone, etc.)\n\nQuanto mais detalhado você for, melhor ficará sua pesquisa!',
      timestamp: new Date(),
      suggestions: [
        'Intenção de voto para prefeito em SP com 300 pessoas, candidatos: João Silva e Maria Santos',
        'Satisfação do cliente sobre produto X com 100 pessoas em todo Brasil',
        'Aceitação de novo aplicativo para 50 jovens de 18-25 anos em capitais'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyContext, setSurveyContext] = useState<SurveyContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const surveySteps: SurveyStep[] = [
    {
      id: 'objective',
      title: 'Definir Objetivo',
      description: 'Entender o propósito da pesquisa',
      status: 'completed',
      icon: Target
    },
    {
      id: 'audience',
      title: 'Público-alvo',
      description: 'Identificar respondentes ideais',
      status: 'in-progress',
      icon: Users
    },
    {
      id: 'methodology',
      title: 'Metodologia',
      description: 'Escolher abordagem de pesquisa',
      status: 'pending',
      icon: BarChart3
    },
    {
      id: 'questions',
      title: 'Criar Perguntas',
      description: 'Gerar perguntas imparciais',
      status: 'pending',
      icon: FileText
    },
    {
      id: 'validation',
      title: 'Validação',
      description: 'Revisar vieses e problemas',
      status: 'pending',
      icon: CheckCircle
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callAIRotation = async (conversationHistory: Message[]): Promise<string> => {
    try {
      console.log('🤖 Calling AI with context:', surveyContext);
      
      const formattedMessages = conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const systemPrompt = `Você é um especialista em metodologia de pesquisa. Analise o contexto e ajude a criar a pesquisa.

CONTEXTO ATUAL:
- Tema: ${surveyContext.theme || 'NÃO DEFINIDO'}
- Tamanho da amostra: ${surveyContext.sampleSize || 'NÃO DEFINIDO'}
- Localização: ${surveyContext.location || 'NÃO DEFINIDA'}
- Candidatos: ${surveyContext.candidates?.join(', ') || 'NÃO DEFINIDOS'}
- Perguntas específicas: ${surveyContext.specificQuestions?.join('; ') || 'NÃO DEFINIDAS'}

REGRAS DE ANÁLISE:
1. Se TODAS as informações obrigatórias estão completas (tema, amostra, localização, perguntas específicas), responda: "CRIAR_PESQUISA_AGORA"
2. Se falta informação, pergunte especificamente o que falta
3. Para pesquisas POLÍTICAS: exija nomes dos candidatos
4. Para pesquisas de PRODUTO: exija características do produto
5. NUNCA repita perguntas já respondidas

Seja direto e objetivo.`;

      const { data, error } = await supabase.functions.invoke('ai-multi-rotation', {
        body: { 
          messages: [
            { role: 'system', content: systemPrompt },
            ...formattedMessages
          ]
        }
      });

      if (error) {
        console.error('❌ AI API Error:', error);
        throw error;
      }

      const aiMessage = data?.choices?.[0]?.message?.content || 
        'Desculpe, tive um problema. Pode repetir?';

      console.log('🤖 AI Response:', aiMessage);
      return aiMessage;
    } catch (error) {
      console.error('❌ Error calling AI:', error);
      return 'Desculpe, estou tendo problemas técnicos. Tente novamente em alguns instantes.';
    }
  };

  const createSurveyAutomatically = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para criar pesquisas.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const surveyTitle = `Pesquisa: ${surveyContext.theme || 'Sem Tema'}`;
      // Gerar perguntas baseadas no contexto
      const generatedQuestions = [];
      
      // Para pesquisas políticas com candidatos
      if (surveyContext.candidates && surveyContext.candidates.length > 0) {
        generatedQuestions.push({
          id: "q1",
          type: "single",
          title: "Se a eleição fosse hoje, em qual candidato você votaria?",
          options: [...surveyContext.candidates, "Nenhum/Branco/Nulo", "Não sei"],
          required: true
        });
        generatedQuestions.push({
          id: "q2",
          type: "single",
          title: "Como você avalia sua intenção de voto?",
          options: ["Totalmente decidido", "Provavelmente votarei neste", "Ainda posso mudar", "Muito indeciso"],
          required: true
        });
      } else {
        // Perguntas genéricas
        generatedQuestions.push({
          id: "q1",
          type: "single",
          title: `Qual sua opinião sobre ${surveyContext.theme || 'o tema'}?`,
          options: ["Muito positivo", "Positivo", "Neutro", "Negativo", "Muito negativo"],
          required: true
        });
      }

      generatedQuestions.push({
        id: "q" + (generatedQuestions.length + 1),
        type: "scale",
        title: "De 0 a 10, qual sua satisfação/avaliação geral?",
        scaleMin: 0,
        scaleMax: 10,
        required: true
      });

      // Adicionar perguntas específicas do usuário
      if (surveyContext.specificQuestions && surveyContext.specificQuestions.length > 0) {
        surveyContext.specificQuestions.forEach((question, index) => {
          generatedQuestions.push({
            id: "q" + (generatedQuestions.length + 1),
            type: "text",
            title: question,
            required: false
          });
        });
      }

      generatedQuestions.push({
        id: "q" + (generatedQuestions.length + 1),
        type: "text",
        title: "Comentários adicionais (opcional)",
        required: false
      });

      const surveyData = {
        user_id: user.id,
        title: surveyTitle,
        description: `${surveyContext.theme}\nLocalização: ${surveyContext.location || 'Não especificada'}\nTamanho da amostra: ${surveyContext.sampleSize} participantes\n${surveyContext.candidates ? 'Candidatos: ' + surveyContext.candidates.join(', ') : ''}`,
        target_sample_size: surveyContext.sampleSize || 10,
        methodology: surveyContext.methodology || 'quota',
        mandatory_questions: {
          age: {
            title: "Qual sua faixa etária?",
            options: surveyContext.ageRanges || ["16-24", "25-34", "35-44", "45-59", "60+"],
            enabled: true
          },
          gender: {
            title: "Qual seu gênero?",
            options: ["Masculino", "Feminino", "Outro"],
            enabled: true
          },
          location: {
            title: `Localização (${surveyContext.location || 'Cidade/Estado'})`,
            enabled: true
          }
        },
        questions: generatedQuestions,
        is_public: true,
        status: 'active',
        current_responses: 0
      };

      console.log('📝 Criando pesquisa no banco:', surveyData);

      const { data: survey, error } = await supabase
        .from('surveys')
        .insert(surveyData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar no banco:', error);
        throw error;
      }

      console.log('✅ Pesquisa criada com ID:', survey.id);

      toast({
        title: "✅ Pesquisa criada!",
        description: `"${survey.title}" está ativa e pronta para receber respostas.`,
      });

      setTimeout(() => {
        navigate('/surveys');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro ao criar pesquisa:', error);
      toast({
        title: "Erro ao criar pesquisa",
        description: error.message || "Tente novamente.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Update context based on user input - DETECÇÃO AVANÇADA
    const lowerInput = inputMessage.toLowerCase();
    const newContext = { ...surveyContext };
    
    // Detectar tema
    if (lowerInput.includes('político') || lowerInput.includes('voto') || lowerInput.includes('eleição') || lowerInput.includes('candidato')) {
      newContext.theme = 'Pesquisa de Intenção de Voto';
      
      // Detectar candidatos
      const candidatePattern = /candidato[s]?:?\s+([^.;]+)/i;
      const match = inputMessage.match(candidatePattern);
      if (match) {
        newContext.candidates = match[1].split(/[,;e]/).map(c => c.trim()).filter(c => c.length > 0);
      }
    } else if (lowerInput.includes('satisfação') || lowerInput.includes('cliente')) {
      newContext.theme = 'Pesquisa de Satisfação do Cliente';
    } else if (lowerInput.includes('produto')) {
      newContext.theme = 'Pesquisa de Aceitação de Produto';
    } else if (!newContext.theme && messages.length === 1) {
      // Extrai o tema do primeiro prompt detalhado
      const firstSentence = inputMessage.split(/[.!?]/)[0];
      newContext.theme = firstSentence.substring(0, 100);
    }
    
    // Detectar localização
    const cidadesEstados = ['são paulo', 'sp', 'rio de janeiro', 'rj', 'minas gerais', 'mg', 'brasil', 'capitais', 'interior'];
    const locationFound = cidadesEstados.find(loc => lowerInput.includes(loc));
    if (locationFound) {
      newContext.location = inputMessage.match(new RegExp(`.{0,30}${locationFound}.{0,30}`, 'i'))?.[0].trim() || locationFound;
    }
    
    // Detectar tamanho da amostra
    const numberMatches = inputMessage.match(/\b(\d+)\s*(pessoas?|participantes?|entrevistados?|respondentes?)\b/i);
    if (numberMatches) {
      const number = parseInt(numberMatches[1]);
      if (number > 0 && number < 100000) {
        newContext.sampleSize = number;
      }
    }
    
    // Detectar perguntas específicas
    const questionPattern = /perguntas?:?\s+([^.;]+(?:[.;][^.;]+)*)/i;
    const qMatch = inputMessage.match(questionPattern);
    if (qMatch) {
      newContext.specificQuestions = qMatch[1].split(/[.;]/).map(q => q.trim()).filter(q => q.length > 5);
    }
    
    // Detectar faixas etárias
    if (lowerInput.includes('16-24') || lowerInput.includes('18-25') || lowerInput.includes('faixa etária')) {
      newContext.ageRanges = ["16-24", "25-34", "35-44", "45-59", "60+"];
    }

    // Detectar metodologia
    if (lowerInput.includes('cota')) {
      newContext.methodology = 'quota';
    } else if (lowerInput.includes('presencial')) {
      newContext.methodology = 'field';
    }

    console.log('📝 Updated context:', newContext);
    setSurveyContext(newContext);
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // DESABILITADO: Criação automática rápida - agora a IA deve coletar TODAS as informações
      // Sempre chama a IA primeiro para coletar informações completas
      const aiResponseContent = await callAIRotation([...messages, userMessage]);
      
      // Check if AI is ready to create survey
      if (aiResponseContent.includes('CRIAR_PESQUISA_AGORA')) {
        console.log('🤖 IA sinalizou para criar pesquisa');
        
        const readyMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `✅ Entendi! Vou criar:\n\n📊 ${newContext.theme || 'Pesquisa'}\n👥 ${newContext.sampleSize || 10} participantes\n\n🚀 Criando no banco de dados...`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, readyMessage]);
        await createSurveyAutomatically();
        return;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponseContent,
        timestamp: new Date(),
        suggestions: [
          'Definir público específico',
          'Calcular amostra necessária',
          'Revisar metodologia',
          'Criar perguntas'
        ]
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      
      // Progress simulation
      if (currentStep < surveySteps.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 500);
      }
    } catch (error) {
      console.error('❌ Error in message handling:', error);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'in-progress';
    return 'pending';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            IA Criadora de Pesquisas
          </h1>
          <p className="text-muted-foreground">
            Assistente especialista em metodologia para criar pesquisas profissionais
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">GPT-4 Powered</Badge>
          <Badge variant="outline">Metodologia Avançada</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso da Criação</CardTitle>
              <CardDescription>
                Etapas para uma pesquisa perfeita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {surveySteps.map((step, index) => {
                const status = getStepStatus(index);
                const IconComponent = step.icon;
                
                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={`
                      rounded-full p-2 border-2 transition-colors
                      ${status === 'completed' ? 'bg-green-100 border-green-500 text-green-700' :
                        status === 'in-progress' ? 'bg-blue-100 border-blue-500 text-blue-700' :
                        'bg-gray-100 border-gray-300 text-gray-500'}
                    `}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : status === 'in-progress' ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className={`font-medium ${
                        status !== 'pending' ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Dicas da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-1">✅ Faça</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Defina objetivos claros</li>
                  <li>• Use linguagem neutra</li>
                  <li>• Teste com uma amostra pequena</li>
                </ul>
              </div>
              <div className="text-sm">
                <p className="font-medium mb-1">❌ Evite</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Perguntas tendenciosas</li>
                  <li>• Amostra muito pequena</li>
                  <li>• Múltiplas interpretações</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Especialista em Metodologia de Pesquisa
              </CardTitle>
              <CardDescription>
                Conversando com IA especializada • Modelo GPT-4 • Fallback automático
              </CardDescription>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <div className={`flex gap-3 max-w-[80%] ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <div className={`
                        rounded-full p-2 border flex-shrink-0
                        ${message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted border-border'}
                      `}>
                        {message.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`
                        p-3 rounded-lg border
                        ${message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-card border-border'}
                      `}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' 
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="rounded-full p-2 border bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="p-3 rounded-lg border bg-card flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        IA analisando e criando resposta...
                      </span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Suggestions */}
            {messages.length > 0 && messages[messages.length - 1].suggestions && !isLoading && (
              <div className="border-t p-4">
                <p className="text-sm font-medium mb-2">Sugestões rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem ou dúvida sobre a pesquisa..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}