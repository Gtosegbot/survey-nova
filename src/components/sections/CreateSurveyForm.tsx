import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";

interface Question {
  id: string;
  type: 'text' | 'multiple' | 'single' | 'scale';
  title: string;
  options?: string[];
  required: boolean;
}

export const CreateSurveyForm = () => {
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [credits, setCredits] = useState(100.00);

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
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const saveSurvey = () => {
    // Simular salvamento
    console.log("Survey saved:", { surveyTitle, surveyDescription, questions });
    alert("Pesquisa salva com sucesso! Você pode distribuir via link/QR code.");
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
          {/* Mandatory Questions Notice */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Perguntas obrigatórias</strong> (adicionadas automaticamente):
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Localidade (País, Estado, Cidade, Região)</li>
              <li>• Sexo (Masculino, Feminino, Outros, Prefiro não responder)</li>
              <li>• Faixa Etária (16-24, 25-34, 35-44, 45-59, 60+)</li>
            </ul>
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
            <Card key={question.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-xs">
                      {question.type === 'text' ? 'Texto Livre' : 
                       question.type === 'single' ? 'Escolha Única' :
                       question.type === 'multiple' ? 'Múltipla Escolha' : 'Escala'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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