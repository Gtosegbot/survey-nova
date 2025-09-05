import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus, 
  TrendingDown,
  TrendingUp,
  MessageSquare,
  Mail,
  Phone,
  Mic,
  Brain,
  Target,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'deduction' | 'bonus';
  amount: number;
  service: string;
  description: string;
  timestamp: string;
  reference?: string;
}

interface ServicePricing {
  service: string;
  description: string;
  unit: string;
  price: number;
  icon: any;
  color: string;
}

const servicePricing: ServicePricing[] = [
  {
    service: 'SMS',
    description: 'Envio de SMS para pesquisas',
    unit: 'por SMS',
    price: 0.15,
    icon: MessageSquare,
    color: 'text-blue-600'
  },
  {
    service: 'E-mail',
    description: 'Disparo de e-mails',
    unit: 'por e-mail',
    price: 0.05,
    icon: Mail,
    color: 'text-green-600'
  },
  {
    service: 'WhatsApp',
    description: 'Mensagens pelo WhatsApp',
    unit: 'por mensagem',
    price: 0.08,
    icon: Phone,
    color: 'text-purple-600'
  },
  {
    service: 'VoIP',
    description: 'Chamadas de voz automatizadas',
    unit: 'por minuto',
    price: 0.25,
    icon: Mic,
    color: 'text-orange-600'
  },
  {
    service: 'IA',
    description: 'Processamento com IA (análise, criação)',
    unit: 'por uso',
    price: 0.30,
    icon: Brain,
    color: 'text-indigo-600'
  },
  {
    service: 'Resposta',
    description: 'Processamento de cada resposta coletada',
    unit: 'por resposta',
    price: 0.02,
    icon: Target,
    color: 'text-red-600'
  }
];

export default function Credits() {
  const { toast } = useToast();
  const [currentBalance, setCurrentBalance] = useState(156.80);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState({
    sms: 124,
    email: 2450,
    whatsapp: 89,
    voip: 12,
    ai: 56,
    responses: 847
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    // Simular histórico de transações
    const mockTransactions: CreditTransaction[] = [
      {
        id: '1',
        type: 'purchase',
        amount: 100.00,
        service: 'Recarga',
        description: 'Compra de créditos via PIX',
        timestamp: '2024-01-15 14:30:00',
        reference: 'TXN123456'
      },
      {
        id: '2',
        type: 'deduction',
        amount: -18.60,
        service: 'SMS',
        description: 'Disparo de SMS - Pesquisa Satisfação Cliente',
        timestamp: '2024-01-14 10:15:00',
        reference: 'SMS-001'
      },
      {
        id: '3',
        type: 'deduction',
        amount: -122.50,
        service: 'E-mail',
        description: 'Campanha de e-mail - 2450 envios',
        timestamp: '2024-01-14 09:30:00',
        reference: 'EMAIL-002'
      },
      {
        id: '4',
        type: 'deduction',
        amount: -7.12,
        service: 'WhatsApp',
        description: 'Mensagens WhatsApp - Pesquisa Mercado',
        timestamp: '2024-01-13 16:45:00',
        reference: 'WPP-003'
      },
      {
        id: '5',
        type: 'bonus',
        amount: 25.00,
        service: 'Bonus',
        description: 'Bônus de boas-vindas',
        timestamp: '2024-01-10 12:00:00',
        reference: 'BONUS-WELCOME'
      }
    ];

    setTransactions(mockTransactions);
  };

  const handlePurchase = (amount: number) => {
    toast({
      title: "Redirecionando para pagamento",
      description: `Você será redirecionado para comprar R$ ${amount.toFixed(2)} em créditos.`,
    });
    
    // Aqui integraria com gateway de pagamento
    console.log(`Iniciando compra de R$ ${amount}`);
  };

  const calculateMonthlySpent = () => {
    return (
      monthlyUsage.sms * 0.15 +
      monthlyUsage.email * 0.05 +
      monthlyUsage.whatsapp * 0.08 +
      monthlyUsage.voip * 0.25 +
      monthlyUsage.ai * 0.30 +
      monthlyUsage.responses * 0.02
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'deduction':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Créditos</h1>
          <p className="text-muted-foreground">Gerencie seus créditos e histórico de uso</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Extrato
          </Button>
          <Button onClick={() => handlePurchase(100)}>
            <Plus className="mr-2 h-4 w-4" />
            Comprar Créditos
          </Button>
        </div>
      </div>

      {/* Saldo Atual */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Saldo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-4xl font-bold text-blue-600">
                R$ {currentBalance.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Gasto este mês: R$ {calculateMonthlySpent().toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" onClick={() => handlePurchase(50)}>
                +R$ 50
              </Button>
              <Button variant="outline" onClick={() => handlePurchase(100)}>
                +R$ 100
              </Button>
              <Button onClick={() => handlePurchase(200)}>
                +R$ 200
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Preços */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Preços</CardTitle>
          <CardDescription>Valores cobrados por cada serviço utilizado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servicePricing.map((service) => (
              <div key={service.service} className="flex items-center gap-3 p-3 border rounded-lg">
                <service.icon className={`h-5 w-5 ${service.color}`} />
                <div className="flex-1">
                  <h4 className="font-medium">{service.service}</h4>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">R$ {service.price.toFixed(2)} {service.unit}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uso Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Uso Este Mês</CardTitle>
          <CardDescription>Resumo do consumo de créditos por serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">SMS</span>
                </div>
                <Badge variant="outline">{monthlyUsage.sms}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                R$ {(monthlyUsage.sms * 0.15).toFixed(2)}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="font-medium">E-mail</span>
                </div>
                <Badge variant="outline">{monthlyUsage.email}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                R$ {(monthlyUsage.email * 0.05).toFixed(2)}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">WhatsApp</span>
                </div>
                <Badge variant="outline">{monthlyUsage.whatsapp}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                R$ {(monthlyUsage.whatsapp * 0.08).toFixed(2)}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">VoIP</span>
                </div>
                <Badge variant="outline">{monthlyUsage.voip} min</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                R$ {(monthlyUsage.voip * 0.25).toFixed(2)}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">IA</span>
                </div>
                <Badge variant="outline">{monthlyUsage.ai}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                R$ {(monthlyUsage.ai * 0.30).toFixed(2)}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Respostas</span>
                </div>
                <Badge variant="outline">{monthlyUsage.responses}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                R$ {(monthlyUsage.responses * 0.02).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Últimas movimentações da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <h4 className="font-medium">{transaction.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      {transaction.service} • {new Date(transaction.timestamp).toLocaleString('pt-BR')}
                    </p>
                    {transaction.reference && (
                      <p className="text-xs text-muted-foreground">Ref: {transaction.reference}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    transaction.type === 'deduction' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.type === 'deduction' ? '' : '+'}R$ {Math.abs(transaction.amount).toFixed(2)}
                  </div>
                  <Badge 
                    variant={
                      transaction.type === 'purchase' ? 'default' :
                      transaction.type === 'bonus' ? 'secondary' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {transaction.type === 'purchase' ? 'Compra' :
                     transaction.type === 'bonus' ? 'Bônus' : 'Uso'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}