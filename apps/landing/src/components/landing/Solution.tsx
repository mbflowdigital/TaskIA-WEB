import { motion } from "framer-motion";
import {
  Mic,
  Sparkles,
  UserCheck,
  CalendarClock,
  MailCheck,
  ClipboardCheck,
  BarChart3,
  FileDown,
} from "lucide-react";

const features = [
  { icon: Mic, title: "Importação de gravações e transcrições", desc: "Suba áudios ou textos de reuniões e a IA extrai automaticamente as atividades." },
  { icon: Sparkles, title: "Geração automática de atividades", desc: "Macro e microatividades criadas instantaneamente com base no contexto." },
  { icon: UserCheck, title: "Sugestão de responsáveis e áreas", desc: "IA sugere e atribui responsáveis com base no perfil e carga de trabalho." },
  { icon: CalendarClock, title: "Prazos definidos automaticamente", desc: "Estimativas inteligentes de prazo considerando dependências e complexidade." },
  { icon: MailCheck, title: "Notificações automáticas", desc: "E-mails de cobrança e lembretes enviados automaticamente nos prazos certos." },
  { icon: ClipboardCheck, title: "Status colaborativo", desc: "Concluir, validar e aprovar tarefas com fluxo de aprovação integrado." },
  { icon: BarChart3, title: "Relatórios de progresso", desc: "Dashboards visuais em tempo real com métricas de andamento e gargalos." },
  { icon: FileDown, title: "Exportação para Excel/CSV", desc: "Exporte seus planos para planilhas com um clique, mantendo a formatação." },
];

const Solution = () => {
  return (
    <section id="solucao" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">A Solução</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Tudo que você precisa para planos de ação eficientes
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nossa plataforma transforma a maneira como você planeja e executa projetos, automatizando cada etapa.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border hover:border-accent/30 hover:-translate-y-1 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <f.icon className="text-accent" size={20} />
              </div>
              <h3 className="font-display text-sm font-semibold text-card-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solution;
