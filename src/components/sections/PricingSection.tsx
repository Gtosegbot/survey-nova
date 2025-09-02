import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building } from "lucide-react";

const plans = [
  {
    name: "Pay Per Use",
    description: "Ideal para pesquisas pontuais",
    price: "R$ 0",
    priceDetail: "Pague apenas pelo que usar",
    icon: Zap,
    features: [
      "IA Gratuita (Groq - 6 contas)",
      "Pesquisas ilimitadas",
      "Até 100 respostas por pesquisa",
      "Analytics básico",
      "Distribuição via link/QR",
      "Suporte por email"
    ],
    credits: "R$ 5,00 por mensagem IA premium",
    popular: false
  },
  {
    name: "Profissional",
    description: "Para pesquisadores regulares",
    price: "R$ 99,90",
    priceDetail: "/mês",
    icon: Crown,
    features: [
      "Tudo do Pay Per Use",
      "IA Premium (GPT-4, Claude)",
      "Pesquisas ilimitadas",
      "Até 1.000 respostas por pesquisa",
      "Analytics avançado",
      "WhatsApp + SMS + Email",
      "Pesquisadores de campo",
      "Cotas demográficas automáticas",
      "Suporte prioritário"
    ],
    credits: "R$ 150 em créditos extras/mês",
    popular: true
  },
  {
    name: "Enterprise",
    description: "Para organizações e institutos",
    price: "R$ 499,90",
    priceDetail: "/mês",
    icon: Building,
    features: [
      "Tudo do Profissional",
      "Respostas ilimitadas",
      "IA customizada",
      "API própria",
      "White-label",
      "Integração com CRM/BI",
      "Gerente de conta dedicado",
      "SLA 99.9%",
      "Treinamento da equipe"
    ],
    credits: "R$ 800 em créditos extras/mês",
    popular: false
  }
];

export const PricingSection = () => {
  return (
    <section className="py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 lg:text-4xl">
            Preços Transparentes
            <span className="block text-primary">Para Todo Tipo de Projeto</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Comece grátis e escale conforme sua necessidade. 
            Sem taxas ocultas, sem surpresas.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative hover:shadow-custom-lg transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-custom-md transform scale-105' 
                  : 'hover:-translate-y-1'
              }`}
            >
              {plan.popular && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary"
                >
                  Mais Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="mx-auto p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4">
                  <plan.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                
                <div className="pt-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.priceDetail}</span>
                  </div>
                  {plan.credits && (
                    <p className="text-sm text-muted-foreground mt-2">
                      + {plan.credits}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? "hero" : "outline"}
                  size="lg"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  {plan.price === "R$ 0" ? "Começar Grátis" : "Assinar Agora"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};