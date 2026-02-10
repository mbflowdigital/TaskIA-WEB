import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/ai-logo.png";

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:4200';

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Solução", href: "#solucao" },
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Benefícios", href: "#beneficios" },
    { label: "Preços", href: "#precos" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-hero/95 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <a href="#" className="flex items-center gap-2">
          <img src={logo} alt="Task AI" className="h-9 w-auto" />
          <span className="font-display text-xl font-bold text-hero-foreground tracking-tight">
            TASK <span className="text-gradient-accent">A.I.</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-hero-muted hover:text-hero-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button 
            variant="ghost" 
            className="text-hero-muted hover:text-hero-foreground hover:bg-white/5"
            asChild
          >
            <a href={`${DASHBOARD_URL}/pages/login`} target="_blank" rel="noopener noreferrer">
              Login
            </a>
          </Button>
          <Button variant="accent">Solicitar Demo</Button>
        </div>

        <button
          className="md:hidden text-hero-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-hero border-t border-white/5 px-4 pb-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-hero-muted hover:text-hero-foreground"
            >
              {l.label}
            </a>
          ))}
          <Button variant="ghost" className="w-full mt-3" asChild>
            <a href={`${DASHBOARD_URL}/pages/login`} target="_blank" rel="noopener noreferrer">
              Login
            </a>
          </Button>
          <Button variant="accent" className="w-full mt-3">Solicitar Demo</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
