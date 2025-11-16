import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Brain, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CollectedInfo {
  topic?: string;
  entities?: string[];
  targetAudience?: string;
  location?: string;
  sampleSize?: number;
  questionCount?: number;
  context?: string;
  researchType?: string;
}

export default function AIResearcher() {
  const { toast } = useToast();
  const [isResearching, setIsResearching] = useState(false);
  const [config, setConfig] = useState<ResearchConfig>({
    title: '',
    description: '',
    targetAudience: '',
    location: '',
    ageRange: '',
    gender: '',
    sampleSize: 100,
    researchTerms: [],
    activeChannels: {
      whatsapp: true,
      sms: true,
      email: true,
      voip: false
    },
    schedule: {
      startDate: '',
      endDate: '',
      frequency: 'continuous'
    }
  });
  const [newTerm, setNewTerm] = useState('');
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const predefinedTerms = [
    'Satisfação com produto',
    'Intenção de compra',
    'Marca preferida',
    'Qualidade do atendimento',
    'Preço justo',
    'Recomendação',
    'Experiência de uso',
    'Problemas encontrados',
    'Sugestões de melhoria',
    'Concorrência'
  ];

  const handleAddTerm = () => {
    if (newTerm.trim() && !config.researchTerms.includes(newTerm.trim())) {
      setConfig(prev => ({
        ...prev,
        researchTerms: [...prev.researchTerms, newTerm.trim()]
      }));
      setNewTerm('');
    }
  };

  const handleRemoveTerm = (term: string) => {
    setConfig(prev => ({
      ...prev,
      researchTerms: prev.researchTerms.filter(t => t !== term)
    }));
  };

  const handleAddPredefinedTerm = (term: string) => {
    if (!config.researchTerms.includes(term)) {
      setConfig(prev => ({
        ...prev,
        researchTerms: [...prev.researchTerms, term]
      }));
    }
  };

  const startResearch = () => {
    if (!config.title || config.researchTerms.length === 0) {
      toast({
        title: "Configuração incompleta",
        description: "Preencha o título e adicione pelo menos um termo de pesquisa.",
        variant: "destructive"
      });
      return;
    }

    setIsResearching(true);
    
    // Simular início da pesquisa
    toast({
      title: "Pesquisa Iniciada",
      description: "A IA está coletando dados baseado nos termos configurados.",
    });

    // Simular coleta de dados após 3 segundos
    setTimeout(() => {
      generateMockResults();
      setShowResults(true);
    }, 3000);
  };

  const stopResearch = () => {
    setIsResearching(false);
    toast({
      title: "Pesquisa Pausada",
      description: "A coleta de dados foi pausada. Você pode retomar a qualquer momento.",
    });
  };

  const generateMockResults = () => {
    const mockResults: ResearchResult[] = Array.from({ length: 15 }, (_, i) => ({
      id: `result_${i}`,
      participant: {
        demographics: {
          age: ['18-24', '25-34', '35-44', '45-59', '60+'][Math.floor(Math.random() * 5)],
          gender: ['Masculino', 'Feminino'][Math.floor(Math.random() * 2)],
          location: config.location || 'São Paulo',
          education: ['Fundamental', 'Médio', 'Superior'][Math.floor(Math.random() * 3)]
        },
        location: {
          lat: -23.5505 + (Math.random() - 0.5) * 0.1,
          lng: -46.6333 + (Math.random() - 0.5) * 0.1
        },
        voicePattern: `voice_pattern_${i}`
      },
      responses: {
        satisfaction: Math.floor(Math.random() * 10) + 1,
        recommendation: Math.random() > 0.3,
        comments: `Resposta simulada do participante ${i + 1}`
      },
      sentiment: {
        score: Math.random(),
        classification: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any
      },
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: ['whatsapp', 'sms', 'email', 'voip'][Math.floor(Math.random() * 4)] as any
    }));

    setResults(mockResults);
  };

  const generateShareableLink = () => {
    const linkId = Math.random().toString(36).substring(7);
    const shareUrl = `${window.location.origin}/research/${linkId}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link Gerado",
      description: "Link da pesquisa copiado para área de transferência.",
    });
  };

  if (showResults) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resultados da Pesquisa IA</h1>
            <p className="text-muted-foreground">{config.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowResults(false)}>
              <Settings className="mr-2 h-4 w-4" />
              Configurar
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={generateShareableLink}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>

        {/* Métricas Gerais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
              <p className="text-xs text-muted-foreground">
                Meta: {config.sampleSize}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sentimento Positivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(results.filter(r => r.sentiment.classification === 'positive').length / results.length * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {results.filter(r => r.sentiment.classification === 'positive').length} respostas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Canais Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(config.activeChannels).filter(Boolean).length}
              </div>
              <p className="text-xs text-muted-foreground">
                De 4 disponíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duplicatas Bloqueadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Por análise de voz
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resultados Detalhados */}
        <Card>
          <CardHeader>
            <CardTitle>Respostas Coletadas</CardTitle>
            <CardDescription>Dados coletados pela IA com análise de sentimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.source.toUpperCase()}
                      </Badge>
                      <Badge 
                        variant={
                          result.sentiment.classification === 'positive' ? 'default' :
                          result.sentiment.classification === 'negative' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {result.sentiment.classification === 'positive' ? 'Positivo' :
                         result.sentiment.classification === 'negative' ? 'Negativo' : 'Neutro'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {result.participant.demographics.location}
                    </div>
                  </div>
                  
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Demografia</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Idade: {result.participant.demographics.age}</div>
                        <div>Gênero: {result.participant.demographics.gender}</div>
                        <div>Educação: {result.participant.demographics.education}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Resposta</h4>
                      <div className="text-xs text-muted-foreground">
                        {result.responses.comments}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">IA Pesquisadora</h1>
        <p className="text-muted-foreground">
          Configure a IA para coletar dados automaticamente baseado em termos pré-definidos
        </p>
      </div>

      {/* Configuração da Pesquisa */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuração da Pesquisa</CardTitle>
            <CardDescription>Defina os parâmetros para coleta automatizada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título da Pesquisa</label>
              <Input 
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Satisfação com Produto X"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea 
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo da pesquisa..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Público-Alvo</label>
                <Input 
                  value={config.targetAudience}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="Ex: Clientes ativos"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Localização</label>
                <Input 
                  value={config.location}
                  onChange={(e) => setConfig(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: São Paulo"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Faixa Etária</label>
                <Select value={config.ageRange} onValueChange={(value) => setConfig(prev => ({ ...prev, ageRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-24">18-24 anos</SelectItem>
                    <SelectItem value="25-34">25-34 anos</SelectItem>
                    <SelectItem value="35-44">35-44 anos</SelectItem>
                    <SelectItem value="45-59">45-59 anos</SelectItem>
                    <SelectItem value="60+">60+ anos</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Gênero</label>
                <Select value={config.gender} onValueChange={(value) => setConfig(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Amostra</label>
                <Input 
                  type="number"
                  value={config.sampleSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, sampleSize: parseInt(e.target.value) || 100 }))}
                  placeholder="100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Termos de Pesquisa</CardTitle>
            <CardDescription>Defina sobre o que a IA deve perguntar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Adicionar termo customizado..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTerm()}
              />
              <Button onClick={handleAddTerm} disabled={!newTerm.trim()}>
                Adicionar
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Termos Pré-definidos</label>
              <div className="flex flex-wrap gap-2">
                {predefinedTerms.map((term) => (
                  <Button 
                    key={term}
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddPredefinedTerm(term)}
                    disabled={config.researchTerms.includes(term)}
                    className="text-xs"
                  >
                    + {term}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Termos Selecionados</label>
              <div className="flex flex-wrap gap-2">
                {config.researchTerms.map((term) => (
                  <Badge 
                    key={term} 
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTerm(term)}
                  >
                    {term} ×
                  </Badge>
                ))}
              </div>
              {config.researchTerms.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum termo selecionado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Canais de Disparo */}
      <Card>
        <CardHeader>
          <CardTitle>Canais de Coleta</CardTitle>
          <CardDescription>Selecione por quais canais a IA deve coletar dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="whatsapp"
                checked={config.activeChannels.whatsapp}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({
                    ...prev,
                    activeChannels: { ...prev.activeChannels, whatsapp: !!checked }
                  }))
                }
              />
              <label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sms"
                checked={config.activeChannels.sms}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({
                    ...prev,
                    activeChannels: { ...prev.activeChannels, sms: !!checked }
                  }))
                }
              />
              <label htmlFor="sms" className="text-sm font-medium">SMS</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email"
                checked={config.activeChannels.email}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({
                    ...prev,
                    activeChannels: { ...prev.activeChannels, email: !!checked }
                  }))
                }
              />
              <label htmlFor="email" className="text-sm font-medium">E-mail</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="voip"
                checked={config.activeChannels.voip}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({
                    ...prev,
                    activeChannels: { ...prev.activeChannels, voip: !!checked }
                  }))
                }
              />
              <label htmlFor="voip" className="text-sm font-medium">VoIP (Ligações)</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isResearching ? (
                <Button onClick={startResearch} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Iniciar Pesquisa IA
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopResearch} className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  Pausar Pesquisa
                </Button>
              )}
              
              <Button variant="outline" onClick={generateShareableLink}>
                <Share2 className="mr-2 h-4 w-4" />
                Gerar Link
              </Button>
            </div>

            {isResearching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                Coletando dados...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}