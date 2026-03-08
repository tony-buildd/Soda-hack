"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import type { KPI } from "@/lib/types";

function ComparisonBar({ label, mcmf, greedy }: { label: string; mcmf: number; greedy: number }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const emerald = isDark ? "#34d399" : "#10b981";
  const gold = isDark ? "#fbbf24" : "#f59e0b";

  const muiTheme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      text: {
        primary: isDark ? "#f1f7f4" : "#12312b",
        secondary: isDark ? "#a8c4ba" : "#4c6b63",
      },
      divider: isDark ? "#263832" : "#d5e0d8",
    },
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-sm font-semibold mb-2">{label}</h2>
        <MuiThemeProvider theme={muiTheme}>
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
          />
        </MuiThemeProvider>
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
