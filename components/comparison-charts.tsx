"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import type { KPI } from "@/lib/types";

function ComparisonBar({ label, mcmf, greedy }: { label: string; mcmf: number; greedy: number }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const emerald = isDark ? "#34d399" : "#10b981";
  const gold = isDark ? "#fbbf24" : "#f59e0b";
  const axisColor = isDark ? "#475569" : "#cbd5e1";
  const labelColor = isDark ? "#e2e8f0" : "#334155";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-sm font-semibold mb-2">{label}</h2>
        <BarChart
          xAxis={[{
            data: ["Comparison"],
            scaleType: "band" as const,
          }]}
          series={[
            {
              data: [mcmf],
              label: "MCMF",
              color: emerald,
              valueFormatter: (v: number | null) => v?.toFixed(2) ?? "",
            },
            {
              data: [greedy],
              label: "Greedy",
              color: gold,
              valueFormatter: (v: number | null) => v?.toFixed(2) ?? "",
            },
          ]}
          height={240}
          margin={{ left: 55, right: 16, top: 20, bottom: 24 }}
          borderRadius={6}
          grid={{ horizontal: true }}
          yAxis={[{ label }]}
          sx={{
            "& .MuiChartsAxis-line": { stroke: axisColor },
            "& .MuiChartsAxis-tick": { stroke: axisColor },
            "& .MuiChartsAxis-tickLabel": { fill: labelColor, fontSize: 11 },
            "& .MuiChartsAxis-label": { fill: labelColor, fontSize: 11 },
            "& .MuiChartsGrid-line": { stroke: gridColor, strokeDasharray: "3 3" },
            "& .MuiChartsLegend-label": { fill: labelColor, fontSize: 11 },
            "& .MuiChartsLegend-root text": { fill: labelColor, fontSize: 11 },
          }}
        />
      </CardContent>
    </Card>
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
