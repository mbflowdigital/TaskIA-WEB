import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "R$ 299",
    period: "/mês",
    desc: "Para equipes pequenas começando a organizar seus projetos.",
    features: ["Até 10 usuários", "Gestão básica de projetos", "Geração de planos por IA", "Exportação para Excel", "Suporte por e-mail"],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Business",
    price: "R$ 799",
    period: "/mês",
    desc: "Para consultorias que precisam de escala e automação.",
    features: ["Usuários ilimitados", "Tudo do Starter", "Follow-up automático", "Integrações (Slack, e-mail, calendário)", "Relatórios avançados", "Suporte prioritário"],
    cta: "Iniciar Trial Grátis",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    desc: "Para grandes organizações com necessidades específicas.",
    features: ["Tudo do Business", "SSO e SAML", "SLA personalizado", "API dedicada", "Segurança avançada (SOC 2)", "Gerente de conta dedicado"],
    cta: "Falar com Vendas",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <section id="precos" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Planos</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Escolha o plano ideal para sua equipe
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Comece com 14 dias grátis. Sem cartão de crédito. Upgrade a qualquer momento.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`rounded-xl p-8 border ${
                p.highlighted
                  ? "bg-hero border-accent/40 shadow-hero relative"
                  : "bg-card border-border shadow-card"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">
                  Mais Popular
                </div>
              )}
              <h3 className={`font-display text-lg font-bold mb-1 ${p.highlighted ? "text-hero-foreground" : "text-card-foreground"}`}>
                {p.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className={`font-display text-3xl font-bold ${p.highlighted ? "text-hero-foreground" : "text-card-foreground"}`}>
                  {p.price}
                </span>
                <span className={`text-sm ${p.highlighted ? "text-hero-muted" : "text-muted-foreground"}`}>{p.period}</span>
              </div>
              <p className={`text-sm mb-6 ${p.highlighted ? "text-hero-muted" : "text-muted-foreground"}`}>{p.desc}</p>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${p.highlighted ? "text-hero-foreground" : "text-card-foreground"}`}>
                    <Check size={16} className="text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.highlighted ? "accent" : "outline"}
                className="w-full gap-2"
              >
                {p.cta} <ArrowRight size={16} />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
