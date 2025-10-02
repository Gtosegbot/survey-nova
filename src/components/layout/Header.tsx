import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Handle scroll to section from navigation state
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      element?.scrollIntoView({ behavior: 'smooth' });
      // Clear the state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleAuth = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Te Pesquisei</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection('features')} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Recursos
          </button>
          <button 
            onClick={() => scrollToSection('pricing')} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Preços
          </button>
          <button 
            onClick={() => scrollToSection('contact')} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Contato
          </button>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleAuth}>
                Entrar
              </Button>
              <Button onClick={handleAuth}>
                Começar Grátis
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg">
            <nav className="flex flex-col p-4 gap-4">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-sm font-medium hover:text-primary transition-colors text-left"
              >
                Recursos
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-sm font-medium hover:text-primary transition-colors text-left"
              >
                Preços
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="text-sm font-medium hover:text-primary transition-colors text-left"
              >
                Contato
              </button>
              {user ? (
                <>
                  <Button variant="outline" onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                    Sair
                  </Button>
                </>
              ) : (
                <Button onClick={handleAuth}>
                  Entrar / Cadastrar
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
