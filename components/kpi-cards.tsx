"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendUp, Path, Scales } from "@phosphor-icons/react";
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
    { label: "Coverage", value: kpi.coverage_pct, suffix: "%", decimals: 2, icon: TrendUp, color: "text-emerald", bg: "bg-mint/50" },
    { label: "Total Travel", value: kpi.total_travel_km, suffix: " km", decimals: 1, icon: Path, color: "text-gold", bg: "bg-amber/10" },
    { label: "Workload Std", value: kpi.workload_std, suffix: "", decimals: 2, icon: Scales, color: "text-sage", bg: "bg-mint/30" },
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted font-medium">{c.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
                  <c.icon size={18} weight="duotone" className={c.color} />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight text-ink">
                <AnimatedNumber value={c.value} suffix={c.suffix} decimals={c.decimals} />
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
