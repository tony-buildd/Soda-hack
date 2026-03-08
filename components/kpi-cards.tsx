"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { GlassCard } from "./glass-card";
import type { KPI } from "@/lib/types";

function AnimatedNumber({ value, suffix = "", decimals = 2 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay((value * eased).toFixed(decimals));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value, decimals]);

  return <span ref={ref}>{display}{suffix}</span>;
}

interface KpiCardsProps {
  kpi: KPI;
}

export function KpiCards({ kpi }: KpiCardsProps) {
  const cards = [
    { label: "Coverage", value: kpi.coverage_pct, suffix: "%", decimals: 2 },
    { label: "Total Travel", value: kpi.total_travel_km, suffix: " km", decimals: 1 },
    { label: "Workload Std", value: kpi.workload_std, suffix: "", decimals: 2 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-sm text-muted font-medium">{c.label}</h2>
            <p className="text-3xl font-bold mt-3 tracking-tight">
              <AnimatedNumber value={c.value} suffix={c.suffix} decimals={c.decimals} />
            </p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
