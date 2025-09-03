import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Settings, Check, Users, Calculator, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  type: 'text' | 'multiple' | 'single' | 'scale' | 'ranking' | 'matrix';
  title: string;
  options?: string[];
  required: boolean;
  saved?: boolean;
  minSelections?: number;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
}

interface MandatoryQuestion {
  id: string;
  category: 'location' | 'gender' | 'age';
  title: string;
  options: string[];
  enabled: boolean;
}

interface DemographicQuota {
  category: string;
  option: string;
  percentage: number;
  targetCount: number;
  currentCount: number;
}

interface SurveyConfig {
  totalParticipants: number;
  quotas: DemographicQuota[];
  methodology: 'random' | 'quota' | 'stratified';
  confidence: number;
  margin: number;
}

export const CreateSurveyForm = () => {
  const { toast } = useToast();
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [credits, setCredits] = useState(100.00);
  const [surveyConfig, setSurveyConfig] = useState<SurveyConfig>({
    totalParticipants: 100,
    quotas: [],
    methodology: 'quota',
    confidence: 95,
    margin: 5
  });
  const [showQuotaCalculator, setShowQuotaCalculator] = useState(false);
  const [mandatoryQuestions, setMandatoryQuestions] = useState<MandatoryQuestion[]>([
    {
      id: "location",
      category: "location",
      title: "Qual sua localização?",
      options: ["São Paulo Capital", "Interior SP", "Rio de Janeiro", "Belo Horizonte", "Outros"],
      enabled: true
    },
    {
      id: "gender", 
      category: "gender",
      title: "Qual seu sexo?",
      options: ["Masculino", "Feminino", "Outro", "Prefiro não responder"],
      enabled: true
    },
    {
      id: "age",
      category: "age", 
      title: "Qual sua faixa etária?",
      options: ["16-24", "25-34", "35-44", "45-59", "60+"],
      enabled: true
    }
  ]);

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: "",
      options: type === 'multiple' || type === 'single' || type === 'ranking' ? [""] : undefined,
      required: false,
      ...(type === 'scale' && { scaleMin: 1, scaleMax: 5, scaleLabels: ["Muito Ruim", "Ruim", "Regular", "Bom", "Muito Bom"] }),
      ...(type === 'multiple' && { minSelections: 1, maxSelections: 3 })
    };
    setQuestions([...questions, newQuestion]);
  };

  const calculateQuotas = () => {
    if (!surveyConfig.totalParticipants || surveyConfig.totalParticipants <= 0) {
      toast({
        title: "Erro",
        description: "Defina o número total de participantes primeiro.",
        variant: "destructive"
      });
      return;
    }

    const newQuotas: DemographicQuota[] = [];
    const enabledQuestions = mandatoryQuestions.filter(q => q.enabled);

    enabledQuestions.forEach(question => {
      question.options.forEach((option, index) => {
        let percentage = 0;
        
        // Distribuição padrão baseada em dados demográficos brasileiros
        if (question.category === 'gender') {
          if (option.toLowerCase().includes('masculino')) percentage = 48.2;
          else if (option.toLowerCase().includes('feminino')) percentage = 51.8;
          else percentage = 0.1;
        } else if (question.category === 'age') {
          const ageRanges = ['16-24', '25-34', '35-44', '45-59', '60+'];
          const agePercentages = [15, 20, 18, 22, 25];
          const ageIndex = ageRanges.findIndex(range => option.includes(range.split('-')[0]));
          percentage = ageIndex >= 0 ? agePercentages[ageIndex] : 100 / question.options.length;
        } else if (question.category === 'location') {
          percentage = 100 / question.options.length; // Distribuição igual por padrão
        }

        newQuotas.push({
          category: question.category,
          option,
          percentage,
          targetCount: Math.round((percentage / 100) * surveyConfig.totalParticipants),
          currentCount: 0
        });
      });
    });

    setSurveyConfig(prev => ({ ...prev, quotas: newQuotas }));
    setShowQuotaCalculator(true);
    
    toast({
      title: "Cotas Calculadas",
      description: `${newQuotas.length} cotas demográficas foram calculadas para ${surveyConfig.totalParticipants} participantes.`
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates, saved: false } : q));
  };

  const saveQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question?.title.trim()) {
      toast({
        title: "Erro",
        description: "A pergunta precisa ter um título.",
        variant: "destructive"
      });
      return;
    }
    
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, saved: true } : q
    ));
    
    toast({
      title: "Pergunta salva",
      description: "A pergunta foi salva com sucesso.",
    });
  };

  const updateMandatoryQuestion = (id: string, updates: Partial<MandatoryQuestion>) => {
    setMandatoryQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, ...updates } : q)
    );
  };

  const addOptionToMandatory = (questionId: string) => {
    setMandatoryQuestions(prev =>
      prev.map(q => 
        q.id === questionId 
          ? { ...q, options: [...q.options, ""] }
          : q
      )
    );
  };

  const updateMandatoryOption = (questionId: string, optionIndex: number, value: string) => {
    setMandatoryQuestions(prev =>
      prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
            }
          : q
      )
    );
  };

  const removeMandatoryOption = (questionId: string, optionIndex: number) => {
    setMandatoryQuestions(prev =>
      prev.map(q => 
        q.id === questionId 
          ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
          : q
      )
    );
  };

  const saveSurvey = () => {
    const unsavedQuestions = questions.filter(q => !q.saved);
    const enabledMandatory = mandatoryQuestions.filter(q => q.enabled);
    
    if (!surveyTitle.trim()) {
      toast({
        title: "Erro",
        description: "A pesquisa precisa ter um título.",
        variant: "destructive"
      });
      return;
    }

    if (unsavedQuestions.length > 0) {
      toast({
        title: "Erro", 
        description: `Você tem ${unsavedQuestions.length} pergunta(s) não salva(s). Salve todas antes de finalizar.`,
        variant: "destructive"
      });
      return;
    }

    if (enabledMandatory.length === 0 && questions.length === 0) {
      toast({
        title: "Erro",
        description: "A pesquisa precisa ter pelo menos uma pergunta.",
        variant: "destructive"
      });
      return;
    }

    // Salvar pesquisa
    const surveyData = {
      id: Date.now().toString(),
      title: surveyTitle,
      description: surveyDescription,
      mandatoryQuestions: enabledMandatory,
      questions: questions,
      config: surveyConfig,
      shareLink: `${window.location.origin}/survey/${Date.now()}`,
      createdAt: new Date(),
      status: 'draft',
      estimatedCost: calculateSurveyCost()
    };

    function calculateSurveyCost() {
      const baseCost = 0.50; // R$ 0,50 por resposta
      const totalCost = surveyConfig.totalParticipants * baseCost;
      return totalCost.toFixed(2);
    }

    // Salvar no localStorage temporariamente
    const existingSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    existingSurveys.push(surveyData);
    localStorage.setItem('surveys', JSON.stringify(existingSurveys));

    toast({
      title: "Sucesso!",
      description: "Pesquisa criada com sucesso!",
    });
    
    // Reset form
    setSurveyTitle("");
    setSurveyDescription("");
    setQuestions([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Criar Nova Pesquisa</h1>
          <p className="text-muted-foreground">Configure sua pesquisa e adicione perguntas personalizadas</p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="text-sm">
            Créditos: R$ {credits.toFixed(2)}
          </Badge>
        </div>
      </div>

      {/* Survey Details */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Pesquisa</CardTitle>
          <CardDescription>Configure os detalhes básicos da sua pesquisa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título da Pesquisa</Label>
              <Input 
                id="title"
                placeholder="Ex: Pesquisa de Satisfação - Cliente X"
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="participants">Total de Participantes</Label>
              <div className="flex gap-2">
                <Input 
                  id="participants"
                  type="number"
                  min="10"
                  max="10000"
                  placeholder="100"
                  value={surveyConfig.totalParticipants}
                  onChange={(e) => setSurveyConfig(prev => ({ 
                    ...prev, 
                    totalParticipants: parseInt(e.target.value) || 100 
                  }))}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={calculateQuotas}
                  disabled={!surveyConfig.totalParticipants}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  Calcular
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description"
              placeholder="Descreva o objetivo da pesquisa e instruções para os respondentes"
              value={surveyDescription}
              onChange={(e) => setSurveyDescription(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Metodologia</Label>
              <select 
                className="w-full p-2 border rounded"
                value={surveyConfig.methodology}
                onChange={(e) => setSurveyConfig(prev => ({ 
                  ...prev, 
                  methodology: e.target.value as 'random' | 'quota' | 'stratified'
                }))}
              >
                <option value="quota">Amostra por Cotas</option>
                <option value="random">Amostra Aleatória</option>
                <option value="stratified">Amostra Estratificada</option>
              </select>
            </div>
            <div>
              <Label>Nível de Confiança (%)</Label>
              <Input 
                type="number"
                min="90"
                max="99"
                value={surveyConfig.confidence}
                onChange={(e) => setSurveyConfig(prev => ({ 
                  ...prev, 
                  confidence: parseInt(e.target.value) || 95 
                }))}
              />
            </div>
            <div>
              <Label>Margem de Erro (%)</Label>
              <Input 
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={surveyConfig.margin}
                onChange={(e) => setSurveyConfig(prev => ({ 
                  ...prev, 
                  margin: parseFloat(e.target.value) || 5 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quota Calculator */}
      {showQuotaCalculator && surveyConfig.quotas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Cotas Demográficas Calculadas
            </CardTitle>
            <CardDescription>
              Distribuição automática para {surveyConfig.totalParticipants} participantes com {surveyConfig.confidence}% de confiança e {surveyConfig.margin}% de margem de erro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveyConfig.quotas.map((quota, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {quota.category === 'gender' ? 'Sexo' : 
                           quota.category === 'age' ? 'Idade' : 'Localização'}
                        </Badge>
                        <span className="text-sm font-medium">{quota.percentage.toFixed(1)}%</span>
                      </div>
                      <p className="font-medium text-sm">{quota.option}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Meta: {quota.targetCount}</span>
                        <span>Atual: {quota.currentCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((quota.currentCount / quota.targetCount) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowQuotaCalculator(false)}
              >
                Ocultar Cotas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={calculateQuotas}
              >
                Recalcular
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas</CardTitle>
          <CardDescription>Configure as perguntas demográficas obrigatórias e adicione perguntas personalizadas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mandatory Questions Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <Label className="text-base font-medium">Perguntas Obrigatórias Configuráveis</Label>
            </div>
            
            {mandatoryQuestions.map((mandatoryQ) => (
              <Card key={mandatoryQ.id} className={`border-l-4 ${mandatoryQ.enabled ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={mandatoryQ.enabled}
                          onCheckedChange={(checked) => 
                            updateMandatoryQuestion(mandatoryQ.id, { enabled: !!checked })
                          }
                        />
                        <Label className="font-medium">{mandatoryQ.category === 'location' ? 'Localização' : mandatoryQ.category === 'gender' ? 'Sexo' : 'Faixa Etária'}</Label>
                      </div>
                      <Badge variant={mandatoryQ.enabled ? "default" : "secondary"}>
                        {mandatoryQ.enabled ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    
                    {mandatoryQ.enabled && (
                      <>
                        <div>
                          <Label>Pergunta</Label>
                          <Input 
                            value={mandatoryQ.title}
                            onChange={(e) => updateMandatoryQuestion(mandatoryQ.id, { title: e.target.value })}
                            placeholder="Digite a pergunta..."
                          />
                        </div>
                        
                        <div>
                          <Label>Opções de Resposta</Label>
                          <div className="space-y-2">
                            {mandatoryQ.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2">
                                <Input
                                  placeholder={`Opção ${optionIndex + 1}`}
                                  value={option}
                                  onChange={(e) => updateMandatoryOption(mandatoryQ.id, optionIndex, e.target.value)}
                                />
                                {mandatoryQ.options.length > 1 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeMandatoryOption(mandatoryQ.id, optionIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addOptionToMandatory(mandatoryQ.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar Opção
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Question Types */}
          <div className="space-y-4">
            <div>
              <Label>Adicionar Pergunta</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => addQuestion('text')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Texto Livre
                </Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion('single')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Escolha Única
                </Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion('multiple')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Múltipla Escolha
                </Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion('scale')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Escala (1-5)
                </Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion('ranking')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ranking
                </Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion('matrix')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Matriz
                </Button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          {questions.map((question, index) => (
            <Card key={question.id} className={`border-l-4 ${question.saved ? 'border-l-green-500' : 'border-l-primary'}`}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {question.type === 'text' ? 'Texto Livre' : 
                         question.type === 'single' ? 'Escolha Única' :
                         question.type === 'multiple' ? 'Múltipla Escolha' : 
                         question.type === 'scale' ? 'Escala' :
                         question.type === 'ranking' ? 'Ranking' : 'Matriz'}
                      </Badge>
                      {question.saved && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Salva
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => saveQuestion(question.id)}
                        disabled={question.saved}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Pergunta {index + 1}</Label>
                    <Input 
                      placeholder="Digite a pergunta..."
                      value={question.title}
                      onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                    />
                  </div>

                  {/* Configurações específicas por tipo de pergunta */}
                  {question.type === 'multiple' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Mín. Seleções</Label>
                        <Input 
                          type="number"
                          min="1"
                          value={question.minSelections || 1}
                          onChange={(e) => updateQuestion(question.id, { minSelections: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label>Máx. Seleções</Label>
                        <Input 
                          type="number"
                          min="1"
                          value={question.maxSelections || 3}
                          onChange={(e) => updateQuestion(question.id, { maxSelections: parseInt(e.target.value) || 3 })}
                        />
                      </div>
                    </div>
                  )}

                  {question.type === 'scale' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Valor Mínimo</Label>
                        <Input 
                          type="number"
                          value={question.scaleMin || 1}
                          onChange={(e) => updateQuestion(question.id, { scaleMin: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label>Valor Máximo</Label>
                        <Input 
                          type="number"
                          value={question.scaleMax || 5}
                          onChange={(e) => updateQuestion(question.id, { scaleMax: parseInt(e.target.value) || 5 })}
                        />
                      </div>
                    </div>
                  )}

                  {(question.type === 'single' || question.type === 'multiple' || question.type === 'ranking') && (
                    <div>
                      <Label>Opções de Resposta</Label>
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <Input
                              placeholder={`Opção ${optionIndex + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optionIndex] = e.target.value;
                                updateQuestion(question.id, { options: newOptions });
                              }}
                            />
                            {(question.options?.length || 0) > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const newOptions = question.options?.filter((_, idx) => idx !== optionIndex) || [];
                                  updateQuestion(question.id, { options: newOptions });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            updateQuestion(question.id, { 
                              options: [...(question.options || []), ""] 
                            });
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Opção
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Cancelar
        </Button>
        <Button onClick={saveSurvey}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Pesquisa
        </Button>
      </div>
    </div>
  );
};