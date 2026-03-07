#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import statistics
from pathlib import Path
from typing import Dict, List

import matplotlib.pyplot as plt


def read_rows(path: Path) -> List[Dict[str, float]]:
  rows: List[Dict[str, float]] = []
  with path.open("r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
      rows.append(
        {
          "mcmf_coverage": float(row["mcmf_coverage"]),
          "greedy_coverage": float(row["greedy_coverage"]),
          "mcmf_travel_km": float(row["mcmf_travel_km"]),
          "greedy_travel_km": float(row["greedy_travel_km"]),
          "mcmf_workload_std": float(row["mcmf_workload_std"]),
          "greedy_workload_std": float(row["greedy_workload_std"]),
          "mcmf_runtime_ms": float(row["mcmf_runtime_ms"]),
          "greedy_runtime_ms": float(row["greedy_runtime_ms"]),
          "coverage_gain_pp": float(row["coverage_gain_pp"]),
          "travel_reduction_pct": float(row["travel_reduction_pct"]),
          "fairness_gain": float(row["fairness_gain"]),
        }
      )
  return rows


def render_summary(rows: List[Dict[str, float]], output_dir: Path) -> None:
  if not rows:
    return

  m_cov = [r["mcmf_coverage"] for r in rows]
  g_cov = [r["greedy_coverage"] for r in rows]
  m_travel = [r["mcmf_travel_km"] for r in rows]
  g_travel = [r["greedy_travel_km"] for r in rows]
  m_runtime = [r["mcmf_runtime_ms"] for r in rows]
  g_runtime = [r["greedy_runtime_ms"] for r in rows]

  summary_path = output_dir / "benchmark_summary.md"
  with summary_path.open("w", encoding="utf-8") as f:
    f.write("# Benchmark Summary\n\n")
    f.write(f"Scenarios: {len(rows)}\n\n")
    f.write("| Metric | MCMF Mean | Greedy Mean |\n")
    f.write("|---|---:|---:|\n")
    f.write(f"| Coverage (%) | {statistics.mean(m_cov):.2f} | {statistics.mean(g_cov):.2f} |\n")
    f.write(f"| Travel (km) | {statistics.mean(m_travel):.2f} | {statistics.mean(g_travel):.2f} |\n")
    f.write(f"| Runtime (ms) | {statistics.mean(m_runtime):.2f} | {statistics.mean(g_runtime):.2f} |\n")


def plot(rows: List[Dict[str, float]], output_dir: Path) -> None:
  if not rows:
    raise ValueError("No rows to plot")

  m_cov = [r["mcmf_coverage"] for r in rows]
  g_cov = [r["greedy_coverage"] for r in rows]
  m_travel = [r["mcmf_travel_km"] for r in rows]
  g_travel = [r["greedy_travel_km"] for r in rows]
  m_std = [r["mcmf_workload_std"] for r in rows]
  g_std = [r["greedy_workload_std"] for r in rows]
  m_runtime = [r["mcmf_runtime_ms"] for r in rows]
  g_runtime = [r["greedy_runtime_ms"] for r in rows]

  # Use a more compact page-friendly ratio so charts do not overflow horizontally.
  fig, axes = plt.subplots(2, 2, figsize=(10, 10))
  fig.suptitle("MCMF vs Greedy Benchmark", fontsize=15, fontweight="bold")

  box_style = dict(patch_artist=True, medianprops={"color": "#1f2937", "linewidth": 1.5})

  b1 = axes[0, 0].boxplot(
    [m_cov, g_cov],
    tick_labels=["MCMF", "Greedy"],
    vert=False,
    **box_style,
  )
  b1["boxes"][0].set(facecolor="#6bbf98")
  b1["boxes"][1].set(facecolor="#f4a261")
  axes[0, 0].set_title("Coverage (%) - Horizontal")
  axes[0, 0].grid(alpha=0.2)

  b2 = axes[0, 1].boxplot(
    [m_travel, g_travel],
    tick_labels=["MCMF", "Greedy"],
    vert=False,
    **box_style,
  )
  b2["boxes"][0].set(facecolor="#6bbf98")
  b2["boxes"][1].set(facecolor="#f4a261")
  axes[0, 1].set_title("Total Travel (km) - Horizontal")
  axes[0, 1].grid(alpha=0.2)

  b3 = axes[1, 0].boxplot(
    [m_std, g_std],
    tick_labels=["MCMF", "Greedy"],
    vert=False,
    **box_style,
  )
  b3["boxes"][0].set(facecolor="#6bbf98")
  b3["boxes"][1].set(facecolor="#f4a261")
  axes[1, 0].set_title("Workload Std (lower is better) - Horizontal")
  axes[1, 0].grid(alpha=0.2)

  axes[1, 1].scatter(g_runtime, m_runtime, alpha=0.6, color="#2a9d8f", edgecolor="none")
  max_axis = max(max(g_runtime), max(m_runtime)) * 1.05
  axes[1, 1].plot([0, max_axis], [0, max_axis], linestyle="--", color="#ef476f", linewidth=1)
  axes[1, 1].set_title("Runtime (ms): Greedy vs MCMF")
  axes[1, 1].set_xlabel("Greedy runtime (ms)")
  axes[1, 1].set_ylabel("MCMF runtime (ms)")
  axes[1, 1].grid(alpha=0.2)

  fig.tight_layout(rect=[0, 0.02, 1, 0.96])
  plot_path = output_dir / "benchmark_comparison.png"
  fig.savefig(plot_path, dpi=150)
  plt.close(fig)

  fig2, ax = plt.subplots(figsize=(8, 4.8))
  improvements = [r["travel_reduction_pct"] for r in rows]
  ax.hist(improvements, bins=20, color="#457b9d", alpha=0.85)
  ax.set_title("Distribution of Travel Reduction % (Greedy -> MCMF)")
  ax.set_xlabel("Travel reduction (%)")
  ax.set_ylabel("Scenario count")
  ax.grid(alpha=0.2)

  hist_path = output_dir / "travel_reduction_hist.png"
  fig2.tight_layout()
  fig2.savefig(hist_path, dpi=150)
  plt.close(fig2)

  print(f"[ok] Wrote: {plot_path}")
  print(f"[ok] Wrote: {hist_path}")


def main() -> None:
  parser = argparse.ArgumentParser(description="Plot benchmark CSV")
  parser.add_argument("--csv", required=True, help="Path to benchmark_runs.csv")
  parser.add_argument("--output-dir", default="benchmark/results", help="Output folder for plots")
  args = parser.parse_args()

  csv_path = Path(args.csv)
  output_dir = Path(args.output_dir)
  output_dir.mkdir(parents=True, exist_ok=True)

  rows = read_rows(csv_path)
  plot(rows, output_dir)
  render_summary(rows, output_dir)


if __name__ == "__main__":
  main()
