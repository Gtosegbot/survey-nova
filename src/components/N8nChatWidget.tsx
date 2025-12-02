import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Loader2, Sparkles, Mic, MicOff, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    isQuestion?: boolean;
    questionType?: string;
    options?: string[];
    surveyData?: any;
  };
}

interface N8nChatWidgetProps {
  onSurveyGenerated?: (surveyData: any) => void;
  onResponseCollected?: (response: any) => void;
  systemPrompt?: string;
  placeholder?: string;
  webhookUrl?: string;
  mode?: 'creator' | 'researcher';
  surveyContext?: any;
}

const N8N_WEBHOOKS = {
  aiChat: 'https://workwebhook.disparoseguro.com/webhook/db8e97f8-21d6-4bc3-a3ea-10cc77a44e6e/chat',
  aiResearcher: 'https://workwebhook.disparoseguro.com/webhook/ai-researcher',
  aiCreator: 'https://workwebhook.disparoseguro.com/webhook/ai-creator'
};

export function N8nChatWidget({ 
  onSurveyGenerated,
  onResponseCollected,
  systemPrompt = "Você é um assistente especializado em pesquisas.",
  placeholder = "Digite sua mensagem...",
  webhookUrl,
  mode = 'researcher',
  surveyContext
}: N8nChatWidgetProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [collectedData, setCollectedData] = useState<any>({});
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const getWelcomeMessage = useCallback(() => {
    if (mode === 'creator') {
      return '👋 Olá! Sou sua IA especialista em criação de pesquisas. Descreva em detalhes o tema da sua pesquisa, público-alvo e objetivos que eu vou criar as perguntas e alternativas ideais para você.';
    }
    return '👋 Olá! Sou sua entrevistadora virtual. Vou conduzir esta pesquisa de forma amigável. Vamos começar? Primeiro, qual é o seu nome completo?';
  }, [mode]);

  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
  }, [getWelcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractSurveyData = (content: string): any | null => {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*"surveyData"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.surveyData || parsed;
      }
      
      // Try to find structured data markers
      if (content.includes('[SURVEY_COMPLETE]') || content.includes('[PESQUISA_CONCLUIDA]')) {
        return collectedData;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  const updateCollectedData = (userMessage: string, assistantResponse: string) => {
    // Extract name
    if (assistantResponse.toLowerCase().includes('prazer') || assistantResponse.toLowerCase().includes('olá,')) {
      const nameMatch = userMessage.match(/(?:me chamo|sou o?a?\s*)?([A-Z][a-zá-ú]+(?: [A-Z][a-zá-ú]+)*)/i);
      if (nameMatch) {
        setCollectedData((prev: any) => ({ ...prev, name: nameMatch[1] }));
      }
    }
    
    // Extract demographics from user messages
    const genderMatch = userMessage.match(/(?:sou\s+)?(masculino|feminino|outro|homem|mulher)/i);
    if (genderMatch) {
      setCollectedData((prev: any) => ({ 
        ...prev, 
        demographics: { 
          ...prev.demographics, 
          gender: genderMatch[1].toLowerCase() 
        } 
      }));
    }
    
    const ageMatch = userMessage.match(/(\d+)\s*(?:anos?|a\.?)/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      let ageRange = '';
      if (age < 18) ageRange = '0-17';
      else if (age < 25) ageRange = '18-24';
      else if (age < 35) ageRange = '25-34';
      else if (age < 45) ageRange = '35-44';
      else if (age < 55) ageRange = '45-54';
      else if (age < 65) ageRange = '55-64';
      else ageRange = '65+';
      
      setCollectedData((prev: any) => ({ 
        ...prev, 
        demographics: { 
          ...prev.demographics, 
          age_range: ageRange,
          exact_age: age
        } 
      }));
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      console.log('🤖 Calling n8n AI webhook...', { mode, conversationId });
      
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const activeWebhook = webhookUrl || N8N_WEBHOOKS.aiChat;
      
      const payload = {
        conversationId,
        mode,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        collectedData,
        surveyContext,
        metadata: {
          timestamp: new Date().toISOString(),
          messageCount: messages.length + 1
        }
      };

      const response = await fetch(activeWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`n8n webhook error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ n8n response:', data);

      const responseContent = data.message || data.response || data.output || 'Desculpe, não consegui processar sua mensagem.';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update collected data based on conversation
      updateCollectedData(textToSend, responseContent);

      // Check if survey data was returned
      const surveyData = extractSurveyData(responseContent) || data.surveyData;
      
      if (surveyData) {
        console.log('📊 Survey data extracted:', surveyData);
        
        if (mode === 'researcher' && onSurveyGenerated) {
          onSurveyGenerated({
            ...surveyData,
            ...collectedData,
            conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
          });
        } else if (mode === 'creator' && onSurveyGenerated) {
          onSurveyGenerated(surveyData);
        }
      }

      // Check for response collection
      if (data.responseCollected && onResponseCollected) {
        onResponseCollected(data.responseCollected);
      }

    } catch (error) {
      console.error('❌ Error calling n8n webhook:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Here you could send the audio to a speech-to-text service
        // For now, we'll just notify the user
        toast({
          title: "Áudio gravado",
          description: "Processamento de voz em desenvolvimento.",
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Gravando...",
        description: "Fale sua resposta agora.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erro ao gravar",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetConversation = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
    setCollectedData({});
    toast({
      title: "Conversa reiniciada",
      description: "Você pode começar uma nova pesquisa.",
    });
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {mode === 'creator' ? 'IA Criadora de Pesquisas' : 'IA Entrevistadora'}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">n8n Powered</Badge>
            <Button variant="ghost" size="icon" onClick={resetConversation} title="Reiniciar conversa">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading || isRecording}
              className="flex-1"
            />
            
            <Button 
              onClick={() => sendMessage()} 
              disabled={!input.trim() || isLoading || isRecording}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {Object.keys(collectedData).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {collectedData.name && (
                <Badge variant="outline" className="text-xs">
                  👤 {collectedData.name}
                </Badge>
              )}
              {collectedData.demographics?.gender && (
                <Badge variant="outline" className="text-xs">
                  {collectedData.demographics.gender}
                </Badge>
              )}
              {collectedData.demographics?.age_range && (
                <Badge variant="outline" className="text-xs">
                  {collectedData.demographics.age_range} anos
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
