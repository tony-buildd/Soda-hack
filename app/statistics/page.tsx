"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageTransition } from "@/components/page-transition";
import { KpiCards } from "@/components/kpi-cards";
import { ComparisonCharts } from "@/components/comparison-charts";
import { GapMatrix } from "@/components/gap-matrix";
import { AllocationTable } from "@/components/allocation-table";
import { UnmetDemand } from "@/components/unmet-demand";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCurrentResults, fetchHistoryRun, fetchRunHistory } from "@/lib/api";
import type { ResultBundle, RunSnapshotSummary } from "@/lib/types";

const AllocationMap = dynamic(
  () => import("@/components/allocation-map").then((m) => m.AllocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card glass-shimmer h-[560px] rounded-2xl" />
    ),
  }
);

type Algorithm = "mcmf" | "greedy";

export default function StatisticsPage() {
  const [currentBundle, setCurrentBundle] = useState<ResultBundle | null>(null);
  const [historyBundle, setHistoryBundle] = useState<ResultBundle | null>(null);
  const [historyRuns, setHistoryRuns] = useState<RunSnapshotSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>("mcmf");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCurrentResults(), fetchRunHistory()])
      .then(([bundle, runs]) => {
        setCurrentBundle(bundle);
        setHistoryRuns(runs);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-10">
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-3">No results loaded</h2>
            <p className="text-sm text-muted">{error}</p>
            <p className="text-sm text-muted mt-3">
              Upload data on the Form page and run the optimizer, or start the
              Flask backend on port 5001.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!currentBundle) {
    return (
      <PageTransition>
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-10 space-y-5">
          <div className="glass-card glass-shimmer h-10 w-56 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-card glass-shimmer h-28 rounded-2xl"
              />
            ))}
          </div>
          <div className="glass-card glass-shimmer h-64 rounded-2xl" />
        </div>
      </PageTransition>
    );
  }

  const bundle = historyBundle ?? currentBundle;
  const result = bundle[algorithm];
  const unmetCount = result.kpi.unmet_demand.length;
  const activeRun = selectedRunId
    ? historyRuns.find((run) => run.id === selectedRunId) ?? bundle.meta?.run_snapshot
    : bundle.meta?.run_snapshot ?? historyRuns[0];
  
  // Calculate total demand from input data
  const totalDemand = bundle.input.schools.reduce((sum, school) => {
    return sum + Object.values(school.demand).reduce((a, b) => a + b, 0);
  }, 0);

  const openRun = async (runId: string | null) => {
    if (!runId) {
      setSelectedRunId(null);
      setHistoryBundle(null);
      return;
    }
    try {
      const snapshot = await fetchHistoryRun(runId);
      setSelectedRunId(runId);
      setHistoryBundle(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved run");
    }
  };

  return (
    <PageTransition>
      <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Allocation Results
            </h1>
            <p className="text-muted mt-1 text-[15px]">
              Review coverage, identify gaps, and export the assignment plan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/form">Back to Input</Link>
            </Button>
            {selectedRunId && (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => void openRun(null)}
              >
                Back to Latest
              </Button>
            )}
            <Badge
              variant="secondary"
              className="rounded-full text-xs"
            >
              {algorithm === "mcmf" ? "Min-Cost Max-Flow" : "Greedy"}
            </Badge>
            <Select
              value={algorithm}
              onValueChange={(v) => setAlgorithm(v as Algorithm)}
            >
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
          {/* 1. KPIs — quick summary at top */}
          <KpiCards kpi={result.kpi} />

          {/* 2. Unmet demand — prominent if any exist */}
          {unmetCount > 0 && (
            <UnmetDemand 
              items={result.kpi.unmet_demand} 
              totalDemand={totalDemand} 
              schools={bundle.input.schools} 
            />
          )}

          {/* 3. Gap matrix — the key decision view */}
          <GapMatrix
            input={bundle.input}
            allocations={result.allocations}
          />

          {/* 4. Map */}
          <AllocationMap
            input={bundle.input}
            allocations={result.allocations}
          />

          {/* 5. Comparison charts + Assignments side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AllocationTable allocations={result.allocations} />
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Run History</CardTitle>
                  <CardDescription>
                    Reopen previous optimizer snapshots over time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeRun && (
                    <div className="rounded-lg border border-line/50 bg-mint/10 px-3 py-2 text-xs text-ink">
                      Viewing {selectedRunId ? "saved snapshot" : "latest snapshot"} from{" "}
                      {new Date(activeRun.created_at).toLocaleString()}.
                    </div>
                  )}
                  <div className="max-h-64 space-y-2 overflow-auto pr-1">
                    {historyRuns.length === 0 ? (
                      <p className="text-sm text-muted">No saved runs yet.</p>
                    ) : (
                      historyRuns.map((run) => {
                        const isActive = (selectedRunId ?? historyRuns[0]?.id ?? null) === run.id;
                        return (
                          <button
                            key={run.id}
                            type="button"
                            onClick={() => void openRun(run.id)}
                            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                              isActive
                                ? "border-emerald/30 bg-mint/20"
                                : "border-line/50 bg-card hover:bg-mint/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-ink">
                                {new Date(run.created_at).toLocaleString()}
                              </span>
                              <Badge variant="secondary" className="rounded-full text-[10px]">
                                {run.trigger.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {run.teacher_count} teachers · {run.school_count} schools ·{" "}
                              {run.allocation_count} allocations
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              Coverage {run.coverage_pct.toFixed(2)}% · Travel{" "}
                              {run.total_travel_km.toFixed(1)} km
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
              <ComparisonCharts
                mcmfKpi={bundle.mcmf.kpi}
                greedyKpi={bundle.greedy.kpi}
              />
              {/* Show unmet demand in sidebar if none shown above */}
              {unmetCount === 0 && (
                <UnmetDemand 
                  items={result.kpi.unmet_demand} 
                  totalDemand={totalDemand}
                  schools={bundle.input.schools}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
