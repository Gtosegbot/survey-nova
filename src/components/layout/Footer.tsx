import { Mail, Phone, MapPin } from "lucide-react";
import tepesquiseiLogo from "@/assets/tepesquisei-logo.png";

const footerSections = [
  {
    title: "Produto",
    links: [
      { name: "Recursos", href: "#features" },
      { name: "Preços", href: "#pricing" },
      { name: "Integrações", href: "/dashboard" },
      { name: "API", href: "/documentation" }
    ]
  },
  {
    title: "Casos de Uso",
    links: [
      { name: "Pesquisas Políticas", href: "/use-cases/political" },
      { name: "Pesquisa de Mercado", href: "/use-cases/market" },
      { name: "Satisfação do Cliente", href: "/use-cases/satisfaction" },
      { name: "Pesquisa Acadêmica", href: "/use-cases/academic" }
    ]
  },
  {
    title: "Recursos",
    links: [
      { name: "Blog", href: "/blog" },
      { name: "Guias", href: "/guides" },
      { name: "Documentação", href: "/documentation" },
      { name: "Suporte", href: "/support" }
    ]
  },
  {
    title: "Empresa",
    links: [
      { name: "Sobre", href: "/about" },
      { name: "Carreira", href: "/careers" },
      { name: "Imprensa", href: "/press" },
      { name: "Contato", href: "/contact" }
    ]
  }
];

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={tepesquiseiLogo} alt="Te Pesquisei" className="h-8 w-8" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Te Pesquisei
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              A plataforma mais avançada para pesquisas inteligentes com IA. 
              Transforme dados em insights que importam.
            </p>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                contato@tepesquisei.com
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                comercial@tepesquisei.com
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                suporte@tepesquisei.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                (11) 95194-7025
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                São Paulo, SP
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Te Pesquisei. Todos os direitos reservados.
          </p>
          
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors">
              Termos de Uso
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </a>
            <a href="/lgpd" className="hover:text-foreground transition-colors">
              LGPD
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};