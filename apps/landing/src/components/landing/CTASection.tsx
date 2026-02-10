import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 bg-accent/10 rounded-full blur-[200px]" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-hero-foreground mb-5">
            Pronto para criar planos de ação <span className="text-gradient-accent">inteligentes</span>?
          </h2>
          <p className="text-hero-muted text-lg mb-8 leading-relaxed">
            Agende uma demonstração personalizada e veja como o Task A.I. pode transformar a gestão de projetos da sua consultoria.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="gap-2">
              Solicitar Demo Personalizada <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" size="lg" className="text-hero-muted hover:text-hero-foreground hover:bg-white/5 gap-2">
              <FileText size={16} /> Baixar Whitepaper
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
