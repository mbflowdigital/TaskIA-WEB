import { motion } from "framer-motion";
import { FileSpreadsheet, Users, Bell } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Planos desorganizados em Excel",
    description: "Informações desatualizadas, versões conflitantes e dificuldade em manter coerência entre equipes.",
  },
  {
    icon: Users,
    title: "Perda de responsabilidade",
    description: "Dúvidas sobre quem faz o quê geram atrasos, retrabalho e falta de comprometimento.",
  },
  {
    icon: Bell,
    title: "Follow-up manual e extenuante",
    description: "Gasto excessivo de tempo em cobranças, atualizações de status e reuniões de alinhamento.",
  },
];

const Problem = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">O Problema</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Dores que sua consultoria enfrenta
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Os métodos tradicionais de gestão de projetos geram ineficiência e perdas significativas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-xl p-8 shadow-card border border-border hover:border-accent/30 transition-colors group"
            >
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-5 group-hover:bg-destructive/15 transition-colors">
                <p.icon className="text-destructive" size={24} />
              </div>
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-3">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;
