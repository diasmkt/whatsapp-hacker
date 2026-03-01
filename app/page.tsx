"use client";

import Link from "next/link";
import { Bot, Zap, Shield, Layout, ArrowRight, MessageSquare, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">IRIS</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Recursos</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">Como funciona</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Preços</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold hover:text-cyan-400 transition-colors px-4 uppercase tracking-widest text-[10px]">Entrar</Link>
            <Link href="/login" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20 active:scale-95">Começar Agora</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8"
          >
            <Zap className="w-3 h-3" /> Já Disponível: IRIS SaaS Core
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 italic uppercase"
          >
            Automatize Seu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">IRIS WhatsApp</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-slate-400 mb-12 font-medium"
          >
            O núcleo premium para sua automação de WhatsApp. Construído para sessões de alto volume e segurança de nível militar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-cyan-900/30 flex items-center justify-center gap-3 active:scale-95 group">
              Começar Teste Grátis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Stats */}
      <section className="pb-32 px-6" id="features">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Iris Guardian", desc: "Isolamento multi-tenant e políticas RLS para manter seus dados seguros." },
            { icon: MessageSquare, title: "Hub Multi-Sessão", desc: "Execute centenas de sessões independentes de WhatsApp simultaneamente." },
            { icon: Layout, title: "Dashboard Next-Gen", desc: "Interface ultra-moderna inspirada em plataformas SaaS de alto nível." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-10 rounded-[2.5rem] bg-slate-900/30 border border-slate-900 hover:border-cyan-500/20 transition-all group"
            >
              <div className="p-4 bg-cyan-600/10 rounded-2xl w-fit mb-8 text-cyan-400 group-hover:scale-110 transition-transform shadow-lg">
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-white/5 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
          <span className="text-2xl font-black italic">DATABASE</span>
          <span className="text-2xl font-black italic">REACT</span>
          <span className="text-2xl font-black italic">NEXTJS</span>
          <span className="text-2xl font-black italic">PRISMA</span>
          <span className="text-2xl font-black italic">TAILWIND</span>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-20 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="text-slate-500 text-sm flex gap-8">
            <Link href="/login" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/login" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/login" className="hover:text-white transition-colors">Contato</Link>
          </div>
          <div className="text-slate-500 text-sm">
            © 2026 Limax SaaS. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
