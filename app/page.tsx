"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChartBar,
  ClipboardText,
  Cpu,
  MapPin,
  Sparkle,
  Student,
  Buildings,
  ChalkboardTeacher,
  Warning,
} from "@phosphor-icons/react";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const crisisStats = [
  { value: "62,877", label: "Teacher shortage nationwide", icon: Warning },
  { value: "26,000+", label: "Satellite schools underserved", icon: Buildings },
  { value: "46.4%", label: "Rural upper secondary completion", icon: Student },
  { value: "5,091", label: "Surplus teachers misallocated", icon: ChalkboardTeacher },
];

const steps = [
  {
    icon: ClipboardText,
    title: "1. Upload Data",
    desc: "Import teacher roster and school demand via CSV. System validates and shows gap summary before any optimization.",
    href: "/form",
  },
  {
    icon: Cpu,
    title: "2. Run Optimizer",
    desc: "Min-Cost Max-Flow algorithm assigns teachers to minimize travel distance while maximizing subject coverage across all schools.",
    href: "/form",
  },
  {
    icon: ChartBar,
    title: "3. Review & Decide",
    desc: "See which schools are covered, which aren't, and why. Override assignments, re-run, and export the final plan.",
    href: "/statistics",
  },
];

export default function LandingPage() {
  return (
    <PageTransition>
      <section className="relative w-full overflow-hidden">
        <motion.div
          className="relative z-10 mx-auto max-w-screen-xl px-6 pt-28 pb-24 md:px-8"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={fadeSlideUp} className="flex justify-center">
            <Badge
              variant="secondary"
              className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border border-emerald/15 bg-mint/50 text-emerald"
            >
              <Sparkle size={14} weight="fill" className="mr-1" />
              SodaHacks 2026 &middot; Hà Giang + Lai Châu Pilot
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeSlideUp}
            className="text-center font-medium tracking-[-0.035em] leading-[1.08] max-w-4xl mx-auto"
          >
            <span className="block text-[clamp(32px,4.5vw,60px)] text-ink">
              Teacher Allocation Optimizer
            </span>
            <span className="block text-[clamp(20px,2.5vw,28px)] text-muted mt-2 font-normal tracking-normal">
              for Vietnam&apos;s mountainous provinces
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeSlideUp}
            className="mt-6 max-w-2xl mx-auto text-center text-[15px] md:text-base leading-relaxed text-muted"
          >
            62,877 teachers short. 5,091 misallocated. 26,000+ satellite schools where
            mandatory subjects go untaught. This tool helps Sở GD&amp;ĐT officers
            generate optimized assignment plans in minutes — not weeks.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeSlideUp} className="mt-8 flex items-center justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="rounded-full px-7 h-12 text-[15px] bg-emerald hover:bg-forest shadow-lg shadow-emerald/15"
            >
              <Link href="/form">
                Upload Data & Optimize
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="rounded-full px-7 h-12 text-[15px] border-line text-ink hover:bg-white/80 dark:hover:bg-white/10"
            >
              <Link href="/statistics">View Demo Results</Link>
            </Button>
          </motion.div>

          {/* Crisis stats */}
          <motion.div
            variants={fadeSlideUp}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            {crisisStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 md:p-5 flex flex-col gap-2">
                  <stat.icon size={20} weight="duotone" className="text-emerald" />
                  <p className="text-2xl md:text-3xl font-bold tracking-tight text-ink">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted leading-snug">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* How it works */}
          <motion.div variants={fadeSlideUp} className="mt-20">
            <h2 className="text-center text-sm font-semibold text-muted uppercase tracking-widest mb-8">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {steps.map((step) => (
                <Link key={step.title} href={step.href} className="group no-underline">
                  <div className="glass-card gradient-border rounded-2xl p-6 h-full transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald/5 group-hover:-translate-y-0.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-emerald mb-4">
                      <step.icon size={22} weight="duotone" />
                    </div>
                    <h3 className="text-base font-semibold text-ink mb-1.5">{step.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Open <ArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Problem context banner */}
          <motion.div variants={fadeSlideUp} className="mt-16">
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/10 text-amber">
                    <MapPin size={22} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ink mb-2">Why this matters</h3>
                    <p className="text-sm text-muted leading-relaxed">
                      In Hà Giang&apos;s Mèo Vạc district, 1 English teacher serves 18 primary schools
                      and 76 Grade 3 classes. Than Uyên district hasn&apos;t rotated a teacher in 6 years.
                      47,000 teachers quit between 2020-2024. Rural students complete upper secondary
                      at 46.4% vs 74.8% urban. One in three Hmong girls never enters school.
                      This tool exists to make allocation decisions data-driven, auditable, and equitable.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>
    </PageTransition>
  );
}
