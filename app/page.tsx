"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { PageTransition } from "@/components/page-transition";
import { ClipboardList, Cpu, BarChart3, ArrowRight, Zap, Globe, Shield } from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Input Data",
    description: "Add teachers and schools through an intuitive form interface, or bulk-import via CSV upload with automatic validation.",
    href: "/form",
    color: "text-teacher",
    bgColor: "bg-teacher/8",
  },
  {
    icon: Cpu,
    title: "Optimize",
    description: "Run Min-Cost Max-Flow for optimal allocation, or compare against a Greedy baseline to validate results.",
    href: "/form",
    color: "text-accent-2",
    bgColor: "bg-accent-2/8",
  },
  {
    icon: BarChart3,
    title: "Visualize Results",
    description: "Interactive maps with teacher-school connections, comparison charts, KPI dashboards, and detailed allocation tables.",
    href: "/statistics",
    color: "text-accent",
    bgColor: "bg-accent/8",
  },
];

const stats = [
  { icon: Zap, label: "Algorithms", value: "2" },
  { icon: Globe, label: "Map Viz", value: "Live" },
  { icon: Shield, label: "Optimization", value: "C++" },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function LandingPage() {
  return (
    <PageTransition>
      {/* Hero — full width, tall */}
      <section className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-8 py-16">
        <div className="max-w-screen-2xl mx-auto w-full">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <div className="inline-flex items-center gap-2 pill bg-accent-2/10 text-accent-2 mb-6">
              <Zap size={12} />
              Powered by Min-Cost Max-Flow
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-5">
              Teacher Allocation
              <span className="block text-accent-2">Optimizer</span>
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-xl mx-auto leading-relaxed">
              Assign the right teachers to the right schools. Input data, run optimization, visualize results — all in one place.
            </p>
            <div className="flex gap-4 justify-center mt-10">
              <Link
                href="/form"
                className="group inline-flex items-center gap-2 rounded-2xl bg-accent-2 px-7 py-3.5 text-base font-semibold text-white no-underline transition-all hover:shadow-lg hover:shadow-accent-2/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/statistics"
                className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white/50 px-7 py-3.5 text-base font-semibold text-ink no-underline transition-all hover:bg-white/80 hover:shadow-md"
              >
                View Results
              </Link>
            </div>
          </motion.div>

          {/* Stat pills */}
          <motion.div
            className="flex justify-center gap-6 mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 glass-card px-5 py-3">
                <s.icon size={18} className="text-accent-2" />
                <div>
                  <p className="text-xs text-muted leading-none">{s.label}</p>
                  <p className="text-sm font-bold leading-tight mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Feature cards — wide grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <Link href={f.href} className="no-underline block h-full group">
                  <GlassCard className="h-full flex flex-col gap-4 px-7 py-8 transition-all group-hover:shadow-xl group-hover:shadow-ink/5">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", f.bgColor)}>
                      <f.icon size={22} className={f.color} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-ink mb-1.5">{f.title}</h2>
                      <p className="text-sm text-muted leading-relaxed">{f.description}</p>
                    </div>
                    <div className="mt-auto pt-3 flex items-center gap-1 text-sm font-semibold text-accent-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore <ArrowRight size={14} />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
