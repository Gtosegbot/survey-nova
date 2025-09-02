import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Settings, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  type: 'text' | 'multiple' | 'single' | 'scale';
  title: string;
  options?: string[];
  required: boolean;
  saved?: boolean;
}

interface MandatoryQuestion {
  id: string;
  category: 'location' | 'gender' | 'age';
  title: string;
  options: string[];
  enabled: boolean;
}

export const CreateSurveyForm = () => {
  const { toast } = useToast();
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [credits, setCredits] = useState(100.00);
  const [mandatoryQuestions, setMandatoryQuestions] = useState<MandatoryQuestion[]>([
    {
      id: "location",
      category: "location",
      title: "Qual sua localização?",
      options: ["País", "Estado", "Cidade", "Região"],
      enabled: true
    },
    {
      id: "gender", 
      category: "gender",
      title: "Qual seu sexo?",
      options: ["Masculino", "Feminino"],
      enabled: true
    },
    {
      id: "age",
      category: "age", 
      title: "Qual sua faixa etária?",
      options: ["16-24", "25-34", "35-44"],
      enabled: true
    }
  ]);

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: "",
      options: type === 'multiple' || type === 'single' ? [""] : undefined,
      required: false
    };
    setQuestions([...questions, newQuestion]);
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
      createdAt: new Date(),
      status: 'draft'
    };

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
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description"
              placeholder="Descreva o objetivo da pesquisa e instruções para os respondentes"
              value={surveyDescription}
              onChange={(e) => setSurveyDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas</CardTitle>
          <CardDescription>Adicione perguntas à sua pesquisa. As perguntas demográficas são obrigatórias.</CardDescription>
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
              <div className="flex gap-2 mt-2">
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
                  Escala
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
                         question.type === 'multiple' ? 'Múltipla Escolha' : 'Escala'}
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

                  {(question.type === 'single' || question.type === 'multiple') && (
                    <div>
                      <Label>Opções de Resposta</Label>
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            placeholder={`Opção ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[optionIndex] = e.target.value;
                              updateQuestion(question.id, { options: newOptions });
                            }}
                          />
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