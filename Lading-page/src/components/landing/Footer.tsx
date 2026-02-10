import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/ai-logo.png";

const Footer = () => {
  return (
    <footer className="bg-hero border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Task AI" className="h-8 w-auto" />
              <span className="font-display text-lg font-bold text-hero-foreground">
                TASK <span className="text-gradient-accent">A.I.</span>
              </span>
            </div>
            <p className="text-hero-muted text-sm leading-relaxed">
              Gerencie projetos com inteligência: crie e monitore tarefas com apenas um clique.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display text-sm font-semibold text-hero-foreground mb-4">Produto</h4>
            <ul className="space-y-2">
              {["Funcionalidades", "Preços", "Integrações", "Roadmap"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display text-sm font-semibold text-hero-foreground mb-4">Recursos</h4>
            <ul className="space-y-2">
              {["Blog", "Central de Ajuda", "Documentação", "Webinars"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-sm font-semibold text-hero-foreground mb-4">Newsletter</h4>
            <p className="text-hero-muted text-sm mb-3">Receba dicas de produtividade e novidades.</p>
            <div className="flex gap-2">
              <Input
                placeholder="Seu e-mail"
                className="bg-white/5 border-white/10 text-hero-foreground placeholder:text-hero-muted/60 focus-visible:ring-accent text-sm"
              />
              <Button variant="accent" size="sm">Assinar</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-hero-muted">© 2025 Task A.I. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            {["Política de Privacidade", "Termos de Uso", "Contato"].map((l) => (
              <a key={l} href="#" className="text-xs text-hero-muted hover:text-hero-foreground transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
