import { BarChart3, Mail, Phone, MapPin } from "lucide-react";

const footerSections = [
  {
    title: "Produto",
    links: [
      { name: "Recursos", href: "#" },
      { name: "Preços", href: "#" },
      { name: "Integrações", href: "#" },
      { name: "API", href: "#" }
    ]
  },
  {
    title: "Casos de Uso",
    links: [
      { name: "Pesquisas Políticas", href: "#" },
      { name: "Pesquisa de Mercado", href: "#" },
      { name: "Satisfação do Cliente", href: "#" },
      { name: "Pesquisa Acadêmica", href: "#" }
    ]
  },
  {
    title: "Recursos",
    links: [
      { name: "Blog", href: "#" },
      { name: "Guias", href: "#" },
      { name: "Documentação", href: "#" },
      { name: "Suporte", href: "#" }
    ]
  },
  {
    title: "Empresa",
    links: [
      { name: "Sobre", href: "#" },
      { name: "Carreira", href: "#" },
      { name: "Imprensa", href: "#" },
      { name: "Contato", href: "#" }
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
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SurveyNova
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              A plataforma mais avançada para pesquisas inteligentes com IA. 
              Transforme dados em insights que importam.
            </p>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                contato@surveynova.com.br
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                (11) 9999-9999
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
            © 2024 SurveyNova. Todos os direitos reservados.
          </p>
          
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              LGPD
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};