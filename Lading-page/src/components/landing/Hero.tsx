import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const Hero = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <section className="bg-hero relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">Potencializado por IA Generativa</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-hero-foreground leading-[1.1] mb-5">
              Planos de ação{" "}
              <span className="text-gradient-accent">inteligentes</span>{" "}
              em minutos, não em dias
            </h1>

            <p className="text-lg text-hero-muted max-w-lg mb-8 leading-relaxed">
              Transforme gravações de reuniões e briefings em planos de projeto completos — com atividades, responsáveis e prazos definidos automaticamente pela IA.
            </p>

            {/* Lead form */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mb-6">
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-hero-foreground placeholder:text-hero-muted/60 focus-visible:ring-accent"
              />
              <Input
                placeholder="E-mail corporativo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-hero-foreground placeholder:text-hero-muted/60 focus-visible:ring-accent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="accent" size="lg" className="gap-2">
                Teste Grátis por 14 Dias <ArrowRight size={18} />
              </Button>
              <Button variant="ghost" size="lg" className="text-hero-muted hover:text-hero-foreground hover:bg-white/5 gap-2">
                <Play size={16} /> Ver demonstração
              </Button>
            </div>

            <p className="text-xs text-hero-muted/60 mt-4">
              Sem cartão de crédito • Setup em 2 minutos • Cancele quando quiser
            </p>
          </motion.div>

          {/* Right - Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-xl overflow-hidden shadow-hero border border-white/10">
              <img
                src={dashboardMockup}
                alt="Dashboard TASK A.I. mostrando plano de ação com macro e microatividades, responsáveis e prazos"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-card rounded-lg shadow-card p-3 border border-border"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-accent-foreground">✓</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-card-foreground">87% menos retrabalho</p>
                  <p className="text-[10px] text-muted-foreground">Média dos clientes</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
