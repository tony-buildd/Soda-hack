"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, MapPin, ChartBar, Sparkle, ClipboardText } from "@phosphor-icons/react";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

const features = [
  {
    icon: ClipboardText,
    title: "Input Data",
    desc: "Add teachers and schools through forms or CSV bulk import with validation.",
    href: "/form",
  },
  {
    icon: Cpu,
    title: "Optimize",
    desc: "Run C++ Min-Cost Max-Flow for optimal allocation, or compare against Greedy baseline.",
    href: "/form",
  },
  {
    icon: ChartBar,
    title: "Visualize",
    desc: "Interactive maps, comparison charts, KPI dashboards, and detailed allocation tables.",
    href: "/statistics",
  },
];

export default function LandingPage() {
  return (
    <PageTransition>
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Gradient accent strip at top */}
        <div className="absolute top-0 left-0 right-0 h-[480px] z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald/[0.04] via-sage/[0.03] to-gold/[0.05] dark:from-emerald/[0.06] dark:via-sage/[0.04] dark:to-gold/[0.03]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ivory to-transparent" />
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-6 pt-[200px] pb-24"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={fadeSlideUp}>
            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border border-emerald/10 bg-mint/50 text-emerald">
              <Sparkle size={14} weight="fill" className="mr-1" />
              Powered by Min-Cost Max-Flow
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeSlideUp}
            className="text-center font-medium tracking-[-0.035em] leading-[1.08]"
          >
            <span className="block text-[clamp(40px,5.5vw,76px)] text-ink">
              Optimal{" "}
              <span
                className="inline-block italic gradient-text"
                style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.25em" }}
              >
                allocation
              </span>
            </span>
            <span className="block text-[clamp(40px,5.5vw,76px)] text-ink">
              for every classroom
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeSlideUp}
            className="mt-6 max-w-[520px] text-center text-[17px] leading-relaxed text-muted"
          >
            Assign the right teachers to the right schools. Input your data,
            run C++ powered optimization, and visualize results on an interactive map.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeSlideUp} className="mt-10 flex items-center gap-3">
            <Button size="lg" asChild className="rounded-full px-7 h-12 text-[15px] bg-emerald hover:bg-forest shadow-lg shadow-emerald/15">
              <Link href="/form">
                Start Allocating
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="rounded-full px-7 h-12 text-[15px] border-line hover:bg-white dark:hover:bg-white/10">
              <Link href="/statistics">
                View Results
              </Link>
            </Button>
          </motion.div>

          {/* Feature pills */}
          <motion.div variants={fadeSlideUp} className="mt-8 flex items-center gap-2">
            {[
              { icon: Cpu, label: "Min-Cost Max-Flow" },
              { icon: MapPin, label: "Geo-Aware" },
              { icon: ChartBar, label: "Live Analytics" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-line/60 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-muted"
              >
                <item.icon size={14} weight="bold" className="text-sage" />
                {item.label}
              </div>
            ))}
          </motion.div>

          {/* Feature cards */}
          <motion.div
            variants={fadeSlideUp}
            className="mt-24 grid w-full grid-cols-1 md:grid-cols-3 gap-5"
          >
            {features.map((f) => (
              <Link key={f.title} href={f.href} className="group no-underline">
                <div className="glass-card gradient-border rounded-2xl p-6 h-full transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald/5 group-hover:-translate-y-0.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-emerald mb-4">
                    <f.icon size={22} weight="duotone" />
                  </div>
                  <h3 className="text-base font-semibold text-ink mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Learn more <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </PageTransition>
  );
}
