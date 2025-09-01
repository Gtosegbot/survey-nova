import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  MessageCircle, 
  BarChart3, 
  Shield, 
  MapPin, 
  Zap,
  Users,
  Settings,
  Smartphone
} from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import mobileSurvey from "@/assets/mobile-survey.jpg";

const features = [
  {
    icon: Brain,
    title: "IA Criadora de Pesquisas",
    description: "Conversação natural para criar pesquisas profissionais automaticamente",
    badge: "IA Avançada"
  },
  {
    icon: MessageCircle,
    title: "IA Pesquisadora Dinâmica",
    description: "Conduz pesquisas conversacionais adaptativas sem perguntas pré-definidas",
    badge: "Inovador"
  },
  {
    icon: BarChart3,
    title: "Analytics em Tempo Real",
    description: "Dashboard com métricas, cotas demográficas e insights automáticos",
    badge: "Pro"
  },
  {
    icon: Shield,
    title: "Validação de Autenticidade",
    description: "GPS, biometria de voz e análise comportamental para garantir qualidade",
    badge: "Seguro"
  },
  {
    icon: MapPin,
    title: "Cotas Demográficas",
    description: "Sistema automático baseado em dados do IBGE para representatividade",
    badge: "Precisão"
  },
  {
    icon: Zap,
    title: "Distribuição Multi-Canal",
    description: "WhatsApp, SMS, Email, links e pesquisadores em campo",
    badge: "Flexível"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 lg:text-4xl">
            Tecnologia de Ponta para
            <span className="block text-primary">Pesquisas Profissionais</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Combine o poder da Inteligência Artificial com metodologia científica 
            para criar pesquisas que realmente importam.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-custom-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Visual Showcase */}
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">
              Dashboard Completo de Analytics
            </h3>
            <p className="text-muted-foreground">
              Acompanhe suas pesquisas com métricas avançadas, visualizações interativas 
              e insights automáticos gerados por IA. Veja o preenchimento de cotas em 
              tempo real e ajuste sua estratégia.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Controle de Cotas
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Gráficos Dinâmicos
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Filtros Avançados
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Alertas em Tempo Real
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src={dashboardPreview} 
              alt="Dashboard Preview" 
              className="rounded-lg shadow-custom-lg w-full"
            />
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center mt-16">
          <div className="order-2 lg:order-1 relative">
            <img 
              src={mobileSurvey} 
              alt="Mobile Survey Interface" 
              className="rounded-lg shadow-custom-lg w-full max-w-md mx-auto"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h3 className="text-2xl font-bold">
              Experiência Mobile Otimizada
            </h3>
            <p className="text-muted-foreground">
              Interface responsiva e intuitiva para respondentes em qualquer dispositivo. 
              Pesquisadores de campo podem coletar dados com validação GPS automática 
              e gravação de áudio para verificação.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                100% Responsivo
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Validação GPS
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Offline First
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                IA Conversacional
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};