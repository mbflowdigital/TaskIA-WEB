import { motion } from "framer-motion";
import { Users, History, Link2, Lock } from "lucide-react";

const features = [
  { icon: Users, title: "Edição Colaborativa", desc: "Múltiplos usuários editando simultaneamente com controle de conflitos." },
  { icon: History, title: "Histórico e Auditoria", desc: "Rastreie todas as alterações com log completo de atividades e responsáveis." },
  { icon: Link2, title: "Integrações", desc: "Conecte com e-mail, calendário, Slack, Teams, Excel e CSV nativamente." },
  { icon: Lock, title: "Segurança e Permissões", desc: "Controle granular de acesso por projeto, equipe e nível hierárquico." },
];

const AdvancedFeatures = () => {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Recursos Avançados</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Construído para equipes exigentes
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-7 shadow-card border border-border"
            >
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="text-primary" size={22} />
              </div>
              <h3 className="font-display text-base font-semibold text-card-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeatures;
