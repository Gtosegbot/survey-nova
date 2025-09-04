import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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

interface SurveyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  icon: React.ComponentType<any>;
}

export default function AICreator() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Olá! Sou sua IA especialista em metodologia de pesquisa. Vou te ajudar a criar uma pesquisa estatisticamente válida e imparcial. Primeiro, me conte: qual é o tema da sua pesquisa?',
      timestamp: new Date(),
      suggestions: [
        'Pesquisa de satisfação do cliente',
        'Intenção de voto político',
        'Aceitação de novo produto',
        'Avaliação de marca'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('satisfação') || lowerMessage.includes('cliente')) {
      return `Excelente! Uma pesquisa de satisfação do cliente é fundamental para o crescimento do negócio. 

Agora preciso entender melhor:

**Objetivos específicos:**
- Você quer medir satisfação geral ou aspectos específicos (atendimento, produto, preço)?
- Há alguma métrica atual que você quer melhorar?
- Esta pesquisa é para benchmarking interno ou comparação com concorrentes?

**Público-alvo:**
- Clientes atuais, ex-clientes ou ambos?
- Algum segmento específico (idade, região, tipo de produto)?
- Quantos clientes você estima ter na base?

**Metodologia sugerida:** Amostra estratificada com 300-500 respondentes para margem de erro de 5% com 95% de confiança.

Me conte mais sobre esses pontos para eu criar a pesquisa perfeita para você!`;
    }
    
    if (lowerMessage.includes('voto') || lowerMessage.includes('político') || lowerMessage.includes('eleição')) {
      return `Pesquisas políticas requerem cuidado especial com imparcialidade e metodologia rigorosa.

**Considerações importantes:**
- **Imparcialidade absoluta:** Perguntas neutras sem induzir respostas
- **Amostra representativa:** Por idade, gênero, região, classe social
- **Timing:** Proximidade da eleição afeta volatilidade

**Informações necessárias:**
- Eleição específica (municipal, estadual, federal)?
- Região de abrangência (cidade, estado, país)?
- Intenção de voto, rejeição ou aprovação?
- Orçamento disponível para a pesquisa?

**Metodologia recomendada:** 
- Mínimo 1.000 entrevistas para margem confiável
- Cotas proporcionais por região e demografia
- Perguntas de controle para detectar vieses

Vamos começar definindo o escopo exato da sua pesquisa eleitoral.`;
    }
    
    if (lowerMessage.includes('produto') || lowerMessage.includes('mercado')) {
      return `Pesquisa de mercado para produtos é essencial antes de lançamentos ou melhorias.

**Etapas que sugiro:**

1. **Análise de aceitação:**
   - Conceito do produto/serviço
   - Preço ideal vs. percepção de valor
   - Comparação com alternativas existentes

2. **Público-alvo:**
   - Demografia do cliente ideal
   - Comportamento de compra
   - Canais de preferência

3. **Teste de conceito:**
   - Apresentação do produto
   - Intenção de compra
   - Sugestões de melhoria

**Perguntas que vou criar:**
- Evitar vieses de confirmação
- Testar aceitação de forma neutra
- Medir disposição real de pagamento

Me conte mais sobre seu produto e objetivos específicos para personalizar a pesquisa!`;
    }

    return `Entendi seu interesse em "${userMessage}". Para criar a melhor pesquisa possível, preciso de mais detalhes:

**Informações importantes:**
- Qual o objetivo principal desta pesquisa?
- Quem é seu público-alvo ideal?
- Há algum prazo específico?
- Qual o orçamento disponível?

**Próximos passos:**
1. Definir metodologia adequada
2. Calcular tamanho da amostra
3. Criar perguntas imparciais
4. Configurar cotas demográficas

Compartilhe mais detalhes para eu personalizar tudo para suas necessidades!`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: simulateAIResponse(inputMessage),
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
        setTimeout(() => setCurrentStep(prev => prev + 1), 1000);
      }
    }, 2000);
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