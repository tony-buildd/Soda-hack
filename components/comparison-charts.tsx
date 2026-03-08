"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from "chart.js";
import { GlassCard } from "./glass-card";
import type { KPI } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

function ComparisonBar({ label, mcmf, greedy }: { label: string; mcmf: number; greedy: number }) {
  return (
    <GlassCard className="p-6">
      <h2 className="text-sm font-semibold mb-3">{label}</h2>
      <div className="h-64">
        <Bar
          data={{
            labels: ["MCMF", "Greedy"],
            datasets: [{
              label,
              data: [mcmf, greedy],
              backgroundColor: ["rgba(47,157,143,0.75)", "rgba(214,108,47,0.72)"],
              borderColor: ["rgba(47,157,143,1)", "rgba(214,108,47,1)"],
              borderWidth: 1,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, title: { display: true, text: label } },
            },
          }}
        />
      </div>
    </GlassCard>
  );
}

interface ComparisonChartsProps {
  mcmfKpi: KPI;
  greedyKpi: KPI;
}

export function ComparisonCharts({ mcmfKpi, greedyKpi }: ComparisonChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ComparisonBar label="Coverage (%)" mcmf={mcmfKpi.coverage_pct} greedy={greedyKpi.coverage_pct} />
      <ComparisonBar label="Travel (km)" mcmf={mcmfKpi.total_travel_km} greedy={greedyKpi.total_travel_km} />
      <ComparisonBar label="Workload Std" mcmf={mcmfKpi.workload_std} greedy={greedyKpi.workload_std} />
    </div>
  );
}
