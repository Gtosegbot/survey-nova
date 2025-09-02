import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Sparkles, Brain, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container relative z-10 py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          {/* Badge */}
          <Badge 
            variant="secondary" 
            className="mb-6 px-4 py-2 text-sm bg-gradient-secondary border-primary/20"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Powered by Advanced AI
          </Badge>

          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-6xl">
            Pesquisas Inteligentes
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              com IA Avançada
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground lg:text-xl">
            Democratize a criação de pesquisas profissionais com IA, 
            garantindo representatividade estatística e insights em tempo real.
          </p>

          {/* Key Features */}
          <div className="mb-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              IA Criadora de Pesquisas
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Analytics em Tempo Real
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Validação Automática
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button 
              size="lg" 
              variant="hero" 
              className="group px-8 py-4 text-lg"
              onClick={() => window.location.href = '/dashboard'}
            >
              Criar Primeira Pesquisa
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="group px-8 py-4 text-lg border-primary/20 hover:border-primary/40"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Play className="mr-2 h-5 w-5" />
              Testar Grátis
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="mb-4 text-sm text-muted-foreground">
              Confiado por pesquisadores em todo o Brasil
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-xs text-muted-foreground">
              <span>+50.000 pesquisas criadas</span>
              <span>+1M respostas coletadas</span>
              <span>95% de precisão estatística</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};