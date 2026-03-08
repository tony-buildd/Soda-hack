"use client";

import { GlassCard } from "./glass-card";
import type { Allocation } from "@/lib/types";

interface AllocationTableProps {
  allocations: Allocation[];
}

export function AllocationTable({ allocations }: AllocationTableProps) {
  return (
    <GlassCard hover={false} className="p-6">
      <h2 className="text-lg font-bold mb-4">Allocations</h2>
      <div className="overflow-auto max-h-[440px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-white/80 backdrop-blur-sm">
            <tr>
              {["Teacher", "School", "Subject", "Hours"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 border-b border-line text-xs text-muted uppercase tracking-wider font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allocations.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-4 text-muted text-center">No allocations</td></tr>
            ) : (
              allocations.map((a, i) => (
                <tr key={i} className="hover:bg-white/40 transition-colors">
                  <td className="px-3 py-2.5 border-b border-line/60">{a.teacher}</td>
                  <td className="px-3 py-2.5 border-b border-line/60">{a.school}</td>
                  <td className="px-3 py-2.5 border-b border-line/60">{a.subject}</td>
                  <td className="px-3 py-2.5 border-b border-line/60 font-medium">{a.hours}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
