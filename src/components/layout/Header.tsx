import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import tepesquiseiLogo from "@/assets/tepesquisei-logo.png";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <img src={tepesquiseiLogo} alt="Te Pesquisei" className="h-8 w-8" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Te Pesquisei
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" size="sm">
              Recursos
            </Button>
            <Button variant="ghost" size="sm">
              Preços
            </Button>
            <Button variant="ghost" size="sm">
              Casos de Uso
            </Button>
            <Button variant="ghost" size="sm">
              Suporte
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Entrar
          </Button>
          <Button variant="hero" size="sm">
            Começar Grátis
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};