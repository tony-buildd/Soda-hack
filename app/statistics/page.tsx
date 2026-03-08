"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PageTransition } from "@/components/page-transition";
import { KpiCards } from "@/components/kpi-cards";
import { ComparisonCharts } from "@/components/comparison-charts";
import { AllocationTable } from "@/components/allocation-table";
import { UnmetDemand } from "@/components/unmet-demand";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchCurrentResults } from "@/lib/api";
import type { ResultBundle } from "@/lib/types";

const AllocationMap = dynamic(() => import("@/components/allocation-map").then((m) => m.AllocationMap), {
  ssr: false,
  loading: () => <div className="glass-card glass-shimmer h-[560px] rounded-2xl" />,
});

type Algorithm = "mcmf" | "greedy";

export default function StatisticsPage() {
  const [bundle, setBundle] = useState<ResultBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>("mcmf");

  useEffect(() => {
    fetchCurrentResults()
      .then(setBundle)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-screen-2xl mx-auto px-8 py-10">
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-3">Failed to load results</h2>
            <p className="text-sm text-muted">{error}</p>
            <p className="text-sm text-muted mt-3">Make sure the Flask backend is running on port 5001.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!bundle) {
    return (
      <PageTransition>
        <div className="max-w-screen-2xl mx-auto px-8 py-10 space-y-5">
          <div className="glass-card glass-shimmer h-10 w-56 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="glass-card glass-shimmer h-28 rounded-2xl" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  const result = bundle[algorithm];

  return (
    <PageTransition>
      <div className="max-w-screen-2xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
            <p className="text-muted mt-1 text-[15px]">Allocation results and performance comparison.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-full text-xs">
              {algorithm === "mcmf" ? "Min-Cost Max-Flow" : "Greedy"}
            </Badge>
            <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as Algorithm)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcmf">Min-Cost Max-Flow</SelectItem>
                <SelectItem value="greedy">Greedy Baseline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          <KpiCards kpi={result.kpi} />
          <ComparisonCharts mcmfKpi={bundle.mcmf.kpi} greedyKpi={bundle.greedy.kpi} />
          <AllocationMap input={bundle.input} allocations={result.allocations} />
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
            <AllocationTable allocations={result.allocations} />
            <UnmetDemand items={result.kpi.unmet_demand} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
