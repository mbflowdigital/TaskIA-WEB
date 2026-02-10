import { motion } from "framer-motion";
import { TrendingDown, Shield, BellRing, Clock, Plug } from "lucide-react";

const benefits = [
  { icon: TrendingDown, title: "Menos retrabalho", desc: "Elimine erros e inconsistências com automação inteligente." },
  { icon: Shield, title: "Maior responsabilização", desc: "Definição clara de papéis e tarefas impulsiona o comprometimento." },
  { icon: BellRing, title: "Follow-up automático", desc: "Notificações e lembretes mantêm todos engajados sem esforço manual." },
  { icon: Clock, title: "Entregas no prazo", desc: "Monitoramento contínuo para evitar atrasos e garantir pontualidade." },
  { icon: Plug, title: "Integração simplificada", desc: "Conecte-se aos seus fluxos de trabalho e ferramentas existentes." },
];

const Benefits = () => {
  return (
    <section id="beneficios" className="py-20 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 right-20 w-80 h-80 bg-accent/10 rounded-full blur-[120px]" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Benefícios</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-hero-foreground mt-3 mb-4">
            Mais produtividade, menos retrabalho
          </h2>
          <p className="text-hero-muted max-w-2xl mx-auto">
            Nossa solução garante que sua equipe foque no que realmente importa: resultados.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="h-14 w-14 mx-auto rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                <b.icon className="text-accent" size={26} />
              </div>
              <h3 className="font-display text-base font-semibold text-hero-foreground mb-2">{b.title}</h3>
              <p className="text-hero-muted text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
