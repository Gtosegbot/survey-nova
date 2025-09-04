import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckSquare, Circle, Type, BarChart3, List, Grid3X3 } from "lucide-react";

interface QuestionType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  useCases: string[];
  example: string;
  pros: string[];
  cons: string[];
}

const questionTypes: QuestionType[] = [
  {
    id: 'text',
    name: 'Resposta Discursiva',
    description: 'Permite respostas abertas e detalhadas dos respondentes',
    icon: Type,
    useCases: [
      'Opiniões detalhadas',
      'Feedback qualitativo',
      'Sugestões e comentários',
      'Análise de sentimento'
    ],
    example: 'O que você mais gosta no nosso produto?',
    pros: [
      'Respostas ricas em detalhes',
      'Insights qualitativos profundos',
      'Flexibilidade total para o respondente'
    ],
    cons: [
      'Análise mais complexa',
      'Menor taxa de resposta',
      'Tempo de resposta maior'
    ]
  },
  {
    id: 'multiple',
    name: 'Múltipla Escolha',
    description: 'Permite selecionar várias opções de uma lista predefinida',
    icon: CheckSquare,
    useCases: [
      'Preferências múltiplas',
      'Hábitos de consumo',
      'Características demográficas',
      'Interesses variados'
    ],
    example: 'Quais redes sociais você utiliza? (selecione todas)',
    pros: [
      'Análise quantitativa fácil',
      'Respostas rápidas',
      'Comparação simples entre opções'
    ],
    cons: [
      'Limitado às opções predefinidas',
      'Pode influenciar as respostas',
      'Risco de seleção excessiva'
    ]
  },
  {
    id: 'single',
    name: 'Escolha Única',
    description: 'Permite selecionar apenas uma opção da lista',
    icon: Circle,
    useCases: [
      'Preferência principal',
      'Classificações demográficas',
      'Decisões binárias',
      'Priorização'
    ],
    example: 'Qual é o seu meio de transporte principal?',
    pros: [
      'Força uma escolha clara',
      'Análise estatística simples',
      'Comparação direta entre opções'
    ],
    cons: [
      'Não captura nuances',
      'Pode ser limitante',
      'Não permite empates'
    ]
  },
  {
    id: 'scale',
    name: 'Escala Likert',
    description: 'Avaliação gradual usando uma escala numérica',
    icon: BarChart3,
    useCases: [
      'Satisfação do cliente',
      'Concordância com afirmações',
      'Qualidade de serviços',
      'Intensidade de sentimentos'
    ],
    example: 'Como você avalia nosso atendimento? (1-5)',
    pros: [
      'Medição precisa de intensidade',
      'Análise estatística robusta',
      'Padrão amplamente aceito'
    ],
    cons: [
      'Pode ser subjetivo',
      'Tendência ao meio-termo',
      'Interpretação cultural variável'
    ]
  },
  {
    id: 'ranking',
    name: 'Ranking/Ordenação',
    description: 'Ordena itens por preferência ou importância',
    icon: List,
    useCases: [
      'Priorização de recursos',
      'Preferências ordenadas',
      'Importância de fatores',
      'Sequência de ações'
    ],
    example: 'Ordene os fatores por importância na compra',
    pros: [
      'Mostra prioridades claras',
      'Força comparação direta',
      'Dados ricos para análise'
    ],
    cons: [
      'Complexo para responder',
      'Pode ser cognitivamente exigente',
      'Difícil em muitos itens'
    ]
  },
  {
    id: 'matrix',
    name: 'Matriz/Grade',
    description: 'Avalia múltiplos itens usando os mesmos critérios',
    icon: Grid3X3,
    useCases: [
      'Avaliação de múltiplos produtos',
      'Satisfação com vários serviços',
      'Comparação de atributos',
      'Pesquisas de marca'
    ],
    example: 'Avalie cada produto nos critérios abaixo',
    pros: [
      'Eficiente para múltiplas avaliações',
      'Comparação consistente',
      'Economia de espaço'
    ],
    cons: [
      'Pode ser confuso',
      'Fadiga do respondente',
      'Tendência a padrões'
    ]
  }
];

interface QuestionTypeGuideProps {
  onSelectType?: (type: string) => void;
}

export function QuestionTypeGuide({ onSelectType }: QuestionTypeGuideProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          Guia de Tipos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guia de Tipos de Pergunta</DialogTitle>
          <DialogDescription>
            Entenda quando e como usar cada tipo de pergunta para obter os melhores resultados
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6">
          {questionTypes.map((type) => (
            <div key={type.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <type.icon className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <p className="text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                {onSelectType && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSelectType(type.id)}
                  >
                    Usar Este Tipo
                  </Button>
                )}
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Casos de Uso</h4>
                  <ul className="space-y-1">
                    {type.useCases.map((useCase, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-1 w-1 bg-current rounded-full" />
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Vantagens</h4>
                  <ul className="space-y-1">
                    {type.pros.map((pro, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-center gap-2">
                        <div className="h-1 w-1 bg-current rounded-full" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Desvantagens</h4>
                  <ul className="space-y-1">
                    {type.cons.map((con, index) => (
                      <li key={index} className="text-sm text-orange-600 flex items-center gap-2">
                        <div className="h-1 w-1 bg-current rounded-full" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded border-l-4 border-l-primary">
                <h4 className="font-medium text-sm mb-1">Exemplo</h4>
                <p className="text-sm">{type.example}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}