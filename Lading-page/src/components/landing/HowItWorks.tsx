import { motion } from "framer-motion";
import { Upload, Brain, Rocket } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Upload,
    title: "Suba gravação ou descreva o projeto",
    desc: "Faça upload de áudio, transcrição ou simplesmente descreva o escopo do projeto em texto livre.",
  },
  {
    num: "02",
    icon: Brain,
    title: "IA gera o plano completo",
    desc: "Em segundos, receba macro atividades, subtarefas, responsáveis sugeridos e prazos estimados.",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Gerencie e automatize entregas",
    desc: "Ajuste o plano, ative notificações automáticas e acompanhe o progresso em tempo real.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Como Funciona</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Do briefing ao plano de ação em 3 passos
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center relative"
            >
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px border-t-2 border-dashed border-accent/20" />
              )}
              <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 shadow-lg">
                <s.icon className="text-accent-foreground" size={32} />
              </div>
              <span className="text-xs font-bold text-accent uppercase tracking-widest">Passo {s.num}</span>
              <h3 className="font-display text-xl font-bold text-foreground mt-2 mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
