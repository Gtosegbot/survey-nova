import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  CheckSquare, 
  Circle, 
  BarChart3, 
  List, 
  Grid3x3,
  Star,
  ThumbsUp
} from "lucide-react";

interface QuestionType {
  type: 'text' | 'multiple' | 'single' | 'scale' | 'ranking' | 'matrix' | 'nps' | 'likert';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  example: {
    question: string;
    preview: React.ReactNode;
  };
}

const questionTypes: QuestionType[] = [
  {
    type: 'text',
    title: 'Texto Livre',
    description: 'Resposta aberta em texto',
    icon: MessageSquare,
    example: {
      question: 'Qual sua opinião sobre nosso atendimento?',
      preview: (
        <div className="border rounded p-2 bg-muted/30">
          <textarea 
            className="w-full text-sm bg-transparent" 
            placeholder="Digite sua resposta..." 
            rows={3}
            disabled
          />
        </div>
      )
    }
  },
  {
    type: 'single',
    title: 'Escolha Única',
    description: 'Selecione apenas uma opção',
    icon: Circle,
    example: {
      question: 'Qual sua faixa etária?',
      preview: (
        <div className="space-y-2">
          {['16-24 anos', '25-34 anos', '35-44 anos', '45+'].map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="example-single" disabled />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      )
    }
  },
  {
    type: 'multiple',
    title: 'Múltipla Escolha',
    description: 'Selecione uma ou mais opções',
    icon: CheckSquare,
    example: {
      question: 'Quais recursos você usa? (escolha até 3)',
      preview: (
        <div className="space-y-2">
          {['Dashboard', 'Relatórios', 'Analytics', 'Exportação'].map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="checkbox" disabled />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      )
    }
  },
  {
    type: 'scale',
    title: 'Escala Numérica',
    description: 'Avaliação de 1 a N',
    icon: BarChart3,
    example: {
      question: 'De 1 a 5, como você avalia o produto?',
      preview: (
        <div className="flex gap-2 justify-between">
          {[1, 2, 3, 4, 5].map((num) => (
            <button 
              key={num} 
              className="px-4 py-2 border rounded hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
              disabled
            >
              {num}
            </button>
          ))}
        </div>
      )
    }
  },
  {
    type: 'nps',
    title: 'NPS',
    description: 'Net Promoter Score (0-10)',
    icon: ThumbsUp,
    example: {
      question: 'Qual a probabilidade de recomendar nossa empresa?',
      preview: (
        <div className="space-y-2">
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, i) => (
              <button 
                key={i} 
                className="aspect-square border rounded text-xs hover:bg-primary hover:text-primary-foreground"
                disabled
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Muito improvável</span>
            <span>Muito provável</span>
          </div>
        </div>
      )
    }
  },
  {
    type: 'likert',
    title: 'Escala Likert',
    description: 'Concordância com afirmações',
    icon: Star,
    example: {
      question: 'O atendimento foi rápido e eficiente',
      preview: (
        <div className="space-y-2">
          {['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'].map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="example-likert" disabled />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      )
    }
  },
  {
    type: 'ranking',
    title: 'Ranking',
    description: 'Ordenar por preferência',
    icon: List,
    example: {
      question: 'Ordene por importância (arraste para reorganizar)',
      preview: (
        <div className="space-y-2">
          {['Preço', 'Qualidade', 'Atendimento', 'Prazo de entrega'].map((opt, i) => (
            <div key={i} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
              <span className="font-medium text-sm">{i + 1}</span>
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      )
    }
  },
  {
    type: 'matrix',
    title: 'Matriz de Perguntas',
    description: 'Múltiplas perguntas com mesmas opções',
    icon: Grid3x3,
    example: {
      question: 'Avalie os seguintes aspectos',
      preview: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left border">Aspecto</th>
                <th className="p-2 border">Ruim</th>
                <th className="p-2 border">Regular</th>
                <th className="p-2 border">Bom</th>
                <th className="p-2 border">Ótimo</th>
              </tr>
            </thead>
            <tbody>
              {['Qualidade', 'Preço', 'Atendimento'].map((aspect, i) => (
                <tr key={i}>
                  <td className="p-2 border">{aspect}</td>
                  {[1, 2, 3, 4].map((col) => (
                    <td key={col} className="p-2 border text-center">
                      <input type="radio" name={`matrix-${i}`} disabled />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }
];

interface QuestionTypeSelectorProps {
  onSelectType: (type: string) => void;
}

export const QuestionTypeSelector = ({ onSelectType }: QuestionTypeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Escolha o Tipo de Pergunta</h3>
        <p className="text-sm text-muted-foreground">
          Selecione o formato mais adequado para coletar as informações que você precisa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questionTypes.map((questionType) => {
          const IconComponent = questionType.icon;
          
          return (
            <Card key={questionType.type} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{questionType.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {questionType.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2 text-muted-foreground">
                    {questionType.example.question}
                  </p>
                  {questionType.example.preview}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onSelectType(questionType.type)}
                >
                  Usar este tipo
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
