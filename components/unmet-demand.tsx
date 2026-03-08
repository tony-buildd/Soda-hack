"use client";

import { GlassCard } from "./glass-card";
import type { UnmetDemandItem } from "@/lib/types";

interface UnmetDemandProps {
  items: UnmetDemandItem[];
}

export function UnmetDemand({ items }: UnmetDemandProps) {
  return (
    <GlassCard hover={false} className="p-6">
      <h2 className="text-lg font-bold mb-4">Unmet Demand</h2>
      <ul className="list-disc pl-5 space-y-2.5 text-sm">
        {items.length === 0 ? (
          <li className="text-muted">No unmet demand.</li>
        ) : (
          items.map((item, i) => (
            <li key={i}>
              {item.school} &mdash; {item.subject}: missing {item.missing_hours}h
            </li>
          ))
        )}
      </ul>
    </GlassCard>
  );
}
