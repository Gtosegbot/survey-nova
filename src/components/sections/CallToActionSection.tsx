import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export const CallToActionSection = () => {
  return (
    <section className="py-24 bg-gradient-primary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40" />
      
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center text-white">
          <Badge 
            variant="secondary" 
            className="mb-6 px-4 py-2 text-sm bg-white/20 text-white border-white/20"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Comece Agora - 100% Gratuito
          </Badge>

          <h2 className="mb-6 text-4xl font-bold lg:text-5xl">
            Pronto para Revolucionar
            <span className="block">Suas Pesquisas?</span>
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90 lg:text-xl">
            Junte-se a milhares de pesquisadores que já descobriram o poder 
            da IA para criar pesquisas mais inteligentes e insights mais profundos.
          </p>

          {/* Key Benefits */}
          <div className="mb-10 flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Setup em 2 minutos
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Dados 100% seguros
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              IA gratuita incluída
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="group px-8 py-4 text-lg bg-white text-primary hover:bg-white/90"
            >
              Criar Primeira Pesquisa Grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-4 text-lg border-white/30 text-white hover:bg-white/10"
            >
              Falar com Especialista
            </Button>
          </div>

          {/* Trust Elements */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="mb-4 text-sm opacity-75">
              Sem cartão de crédito • Sem compromisso • Cancele quando quiser
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-xs opacity-75">
              <span>⭐ 4.9/5 de satisfação</span>
              <span>🔒 LGPD compliant</span>
              <span>⚡ 99.9% uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};