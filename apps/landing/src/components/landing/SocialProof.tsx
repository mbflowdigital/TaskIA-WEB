import { motion } from "framer-motion";
import { Star, ShieldCheck } from "lucide-react";

const testimonials = [
  {
    quote: "O Task A.I. reduziu nosso tempo de planejamento em 80%. Antes levávamos dias para montar um plano de ação, agora são minutos.",
    name: "Ana Ferreira",
    role: "Gerente de Projetos, Big 4",
    rating: 5,
  },
  {
    quote: "A atribuição automática de responsáveis e os follow-ups acabaram com o problema de tarefas 'sem dono'. Transformou nossa entrega.",
    name: "Carlos Mendes",
    role: "PMO, Consultoria de Gestão",
    rating: 5,
  },
  {
    quote: "Finalmente saímos do Excel. A integração com e-mail e Slack tornou o acompanhamento natural e não invasivo.",
    name: "Mariana Santos",
    role: "Diretora de Operações, Tech Consulting",
    rating: 5,
  },
];

const logos = ["Deloitte", "EY", "KPMG", "PwC", "Accenture", "McKinsey"];

const SocialProof = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Prova Social</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Consultorias que confiam no Task A.I.
          </h2>
        </motion.div>

        {/* Logos */}
        <div className="flex flex-wrap justify-center gap-8 mb-14">
          {logos.map((name) => (
            <div
              key={name}
              className="px-6 py-3 rounded-lg bg-muted/50 border border-border"
            >
              <span className="font-display text-sm font-semibold text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bg-card rounded-xl p-7 shadow-card border border-border"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-card-foreground text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-sm text-card-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mt-10 text-muted-foreground"
        >
          <ShieldCheck size={18} className="text-accent" />
          <span className="text-sm">Conformidade LGPD & GDPR • Dados criptografados • SOC 2 em andamento</span>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
