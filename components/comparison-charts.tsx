"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import type { KPI } from "@/lib/types";

function ComparisonBar({ label, mcmf, greedy, unit }: { label: string; mcmf: number; greedy: number; unit?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const muiTheme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      text: {
        primary: isDark ? "#f1f7f4" : "#12312b",
        secondary: isDark ? "#a8c4ba" : "#4c6b63",
      },
      divider: isDark ? "#263832" : "#d5e0d8",
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: "transparent",
            boxShadow: "none",
          }
        }
      }
    }
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">{label}</h2>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-[#34d399]" : "bg-[#1a6b4a]"}`}></span>
              <span className="text-muted">MCMF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span className="text-muted">Greedy</span>
            </div>
          </div>
        </div>
        <MuiThemeProvider theme={muiTheme}>
          <BarChart
            xAxis={[{
              scaleType: "band",
              data: ["Result"],
            }]}
            series={[
              {
                data: [mcmf],
                label: "MCMF",
                color: isDark ? "#34d399" : "#1a6b4a",
              },
              {
                data: [greedy],
                label: "Greedy",
                color: "#94a3b8", // Slate 400
              }
            ]}
            height={220}
            margin={{ left: 50, right: 10, top: 10, bottom: 30 }}
            borderRadius={6}
            grid={{ horizontal: true }}
            hideLegend
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
    <div className="grid grid-cols-1 gap-4">
      <ComparisonBar label="Coverage (%)" mcmf={mcmfKpi.coverage_pct} greedy={greedyKpi.coverage_pct} />
      <ComparisonBar label="Travel (km)" mcmf={mcmfKpi.total_travel_km} greedy={greedyKpi.total_travel_km} />
      <ComparisonBar label="Workload Std" mcmf={mcmfKpi.workload_std} greedy={greedyKpi.workload_std} />
    </div>
  );
}
