import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Brain, 
  BarChart3, 
  Users,
  Shield,
  Zap
} from "lucide-react";
import tepesquiseiLogo from "@/assets/tepesquisei-logo.png";

export default function Auth() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard..."
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate signup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao Te Pesquisei! Redirecionando..."
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: "IA Avançada",
      description: "Crie pesquisas com assistência de IA e análise automática de respostas"
    },
    {
      icon: BarChart3,
      title: "Analytics em Tempo Real",
      description: "Acompanhe suas pesquisas com dashboards dinâmicos e métricas detalhadas"
    },
    {
      icon: Users,
      title: "Gestão de Equipes",
      description: "Colabore com sua equipe e gerencie pesquisadores em campo"
    },
    {
      icon: Shield,
      title: "Validação Automática",
      description: "Sistema anti-fraude com validação por GPS, voz e comportamento"
    },
    {
      icon: Zap,
      title: "Disparos Automatizados",
      description: "Envie pesquisas via WhatsApp, SMS, Email e integre com suas ferramentas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Features & Branding */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <img 
              src={tepesquiseiLogo} 
              alt="Te Pesquisei" 
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Te Pesquisei
              </h1>
              <p className="text-muted-foreground">
                Pesquisas Inteligentes com IA
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Revolucione suas Pesquisas com IA
            </h2>
            <p className="text-lg text-muted-foreground">
              Plataforma completa para criação, distribuição e análise de pesquisas 
              políticas, de mercado e opinião com tecnologia de ponta.
            </p>
          </div>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border">
                <feature.icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <Badge variant="secondary">IA Avançada</Badge>
            <Badge variant="secondary">Analytics Real-time</Badge>
            <Badge variant="secondary">Anti-fraude</Badge>
            <Badge variant="secondary">Multi-canal</Badge>
            <Badge variant="secondary">LGPD Compliant</Badge>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Entre na sua conta para continuar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Sua senha"
                          className="pl-10"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Criar conta</CardTitle>
                  <CardDescription>
                    Comece sua jornada com pesquisas inteligentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Seu nome completo"
                          className="pl-10"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa (opcional)</Label>
                      <Input
                        id="company"
                        placeholder="Nome da sua empresa"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          className="pl-10"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirme sua senha"
                          className="pl-10"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Criando conta..." : "Criar conta"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Ao criar uma conta, você concorda com nossos{" "}
                      <a href="/terms" className="text-primary hover:underline">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        Política de Privacidade
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}