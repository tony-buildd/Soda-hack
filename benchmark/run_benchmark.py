#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import csv
import json
import random
import statistics
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
  sys.path.insert(0, str(ROOT))

from dynamic_backend.reoptimizer import compute_kpi, haversine_km, run_reoptimizer


TeacherMap = Dict[str, Dict[str, Any]]
SchoolMap = Dict[str, Dict[str, Any]]


def load_input(path: Path) -> Tuple[TeacherMap, SchoolMap]:
  with path.open("r", encoding="utf-8") as f:
    raw = json.load(f)

  teachers: TeacherMap = {}
  schools: SchoolMap = {}

  for t in raw.get("teachers", []):
    tid = str(t["id"])
    teachers[tid] = {
      "id": tid,
      "name": str(t.get("name", tid)),
      "capacity": max(0, int(t.get("capacity", 0))),
      "subjects": [str(s) for s in t.get("subjects", [])],
      "base": [float(t.get("base", [0.0, 0.0])[0]), float(t.get("base", [0.0, 0.0])[1])],
      "active": bool(t.get("active", True)),
    }

  for s in raw.get("schools", []):
    sid = str(s["id"])
    schools[sid] = {
      "id": sid,
      "name": str(s.get("name", sid)),
      "priority": int(s.get("priority", 1)),
      "location": [
        float(s.get("location", [0.0, 0.0])[0]),
        float(s.get("location", [0.0, 0.0])[1]),
      ],
      "demand": {str(k): max(0, int(v)) for k, v in s.get("demand", {}).items()},
      "active": bool(s.get("active", True)),
    }

  return teachers, schools


def ensure_any_active_teacher(teachers: TeacherMap, rng: random.Random) -> None:
  active_ids = [tid for tid, t in teachers.items() if t.get("active", True)]
  if active_ids:
    return
  chosen = rng.choice(list(teachers.keys()))
  teachers[chosen]["active"] = True
  teachers[chosen]["capacity"] = max(1, int(teachers[chosen].get("capacity", 1)))


def clamp_priority(priority: int) -> int:
  return max(1, min(5, int(priority)))


def generate_scenario(
  base_teachers: TeacherMap,
  base_schools: SchoolMap,
  rng: random.Random,
) -> Tuple[TeacherMap, SchoolMap, Set[Tuple[str, str]]]:
  teachers = copy.deepcopy(base_teachers)
  schools = copy.deepcopy(base_schools)

  cap_global = rng.uniform(0.8, 1.2)
  demand_global = rng.uniform(0.8, 1.35)

  for t in teachers.values():
    local = rng.uniform(0.85, 1.15)
    updated = int(round(int(t["capacity"]) * cap_global * local))
    t["capacity"] = max(0, updated)

    if rng.random() < 0.06:
      t["active"] = False
    else:
      t["active"] = True

  for s in schools.values():
    if rng.random() < 0.03:
      s["active"] = False

    demand = s.get("demand", {})
    for subject, base_hours in list(demand.items()):
      local = rng.uniform(0.75, 1.35)
      new_hours = int(round(int(base_hours) * demand_global * local))
      if rng.random() < 0.08:
        new_hours = max(0, new_hours + rng.randint(2, 8))
      demand[subject] = max(0, new_hours)

    s["priority"] = clamp_priority(int(s.get("priority", 1)) + rng.randint(-1, 1))

  ensure_any_active_teacher(teachers, rng)

  blocked_routes: Set[Tuple[str, str]] = set()
  teacher_ids = [tid for tid, t in teachers.items() if t.get("active", True)]
  school_ids = [sid for sid, s in schools.items() if s.get("active", True)]

  if teacher_ids and school_ids:
    num_blocks = rng.randint(0, max(1, len(teacher_ids) // 3))
    for _ in range(num_blocks):
      if rng.random() < 0.25:
        blocked_routes.add((rng.choice(teacher_ids), rng.choice(school_ids)))

  return teachers, schools, blocked_routes


def run_greedy_baseline(
  teachers: TeacherMap,
  schools: SchoolMap,
  blocked_routes: Set[Tuple[str, str]],
) -> List[Dict[str, Any]]:
  demand_items: List[Dict[str, Any]] = []
  for sid, school in schools.items():
    if not school.get("active", True):
      continue
    for subject, hours in school.get("demand", {}).items():
      demand_hours = max(0, int(hours))
      if demand_hours <= 0:
        continue
      demand_items.append(
        {
          "school_id": sid,
          "subject": str(subject),
          "demand": demand_hours,
          "priority": int(school.get("priority", 1)),
        }
      )

  demand_items.sort(key=lambda x: (-x["priority"], -x["demand"], x["school_id"], x["subject"]))

  remaining = {}
  for tid, teacher in teachers.items():
    if not teacher.get("active", True):
      continue
    remaining[tid] = max(0, int(teacher.get("capacity", 0)))

  allocations: List[Dict[str, Any]] = []

  for item in demand_items:
    sid = item["school_id"]
    subject = item["subject"]
    needed = int(item["demand"])

    candidates: List[Tuple[float, str]] = []
    for tid, teacher in teachers.items():
      if tid not in remaining:
        continue
      if remaining[tid] <= 0:
        continue
      if subject not in set(str(s) for s in teacher.get("subjects", [])):
        continue
      if (tid, sid) in blocked_routes:
        continue

      dist = haversine_km(teacher["base"], schools[sid]["location"])
      candidates.append((dist, tid))

    candidates.sort(key=lambda x: (x[0], x[1]))

    for _, tid in candidates:
      if needed <= 0:
        break
      assign = min(needed, remaining[tid])
      if assign <= 0:
        continue

      allocations.append(
        {
          "teacher": tid,
          "school": sid,
          "subject": subject,
          "hours": int(assign),
        }
      )
      remaining[tid] -= int(assign)
      needed -= int(assign)

  allocations.sort(key=lambda x: (x["teacher"], x["school"], x["subject"]))
  return allocations


def total_demand_hours(schools: SchoolMap) -> int:
  total = 0
  for school in schools.values():
    if not school.get("active", True):
      continue
    for hours in school.get("demand", {}).values():
      total += max(0, int(hours))
  return total


def summarize(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
  if not rows:
    return {"num_scenarios": 0}

  cov_gain = [r["coverage_gain_pp"] for r in rows]
  travel_red = [r["travel_reduction_pct"] for r in rows]
  runtime_ratio = [r["runtime_ratio"] for r in rows]
  fairness_gain = [r["fairness_gain"] for r in rows]

  wins_cov = sum(1 for r in rows if r["mcmf_coverage"] >= r["greedy_coverage"] - 1e-9)
  wins_travel = sum(1 for r in rows if r["mcmf_travel_km"] <= r["greedy_travel_km"] + 1e-9)
  wins_fairness = sum(1 for r in rows if r["mcmf_workload_std"] <= r["greedy_workload_std"] + 1e-9)

  return {
    "num_scenarios": len(rows),
    "coverage_gain_pp": {
      "mean": round(statistics.mean(cov_gain), 3),
      "median": round(statistics.median(cov_gain), 3),
      "min": round(min(cov_gain), 3),
      "max": round(max(cov_gain), 3),
    },
    "travel_reduction_pct": {
      "mean": round(statistics.mean(travel_red), 3),
      "median": round(statistics.median(travel_red), 3),
      "min": round(min(travel_red), 3),
      "max": round(max(travel_red), 3),
    },
    "fairness_gain_std": {
      "mean": round(statistics.mean(fairness_gain), 3),
      "median": round(statistics.median(fairness_gain), 3),
      "min": round(min(fairness_gain), 3),
      "max": round(max(fairness_gain), 3),
    },
    "runtime_ratio_mcmf_over_greedy": {
      "mean": round(statistics.mean(runtime_ratio), 3),
      "median": round(statistics.median(runtime_ratio), 3),
      "min": round(min(runtime_ratio), 3),
      "max": round(max(runtime_ratio), 3),
    },
    "win_rate": {
      "coverage": round(100.0 * wins_cov / len(rows), 2),
      "travel": round(100.0 * wins_travel / len(rows), 2),
      "fairness": round(100.0 * wins_fairness / len(rows), 2),
    },
  }


def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
  if not rows:
    return

  fields = [
    "scenario_id",
    "seed",
    "total_demand_hours",
    "active_teachers",
    "active_schools",
    "blocked_routes",
    "mcmf_coverage",
    "greedy_coverage",
    "coverage_gain_pp",
    "mcmf_travel_km",
    "greedy_travel_km",
    "travel_reduction_pct",
    "mcmf_workload_std",
    "greedy_workload_std",
    "fairness_gain",
    "mcmf_runtime_ms",
    "greedy_runtime_ms",
    "runtime_ratio",
    "mcmf_unmet_slots",
    "greedy_unmet_slots",
  ]

  with path.open("w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for row in rows:
      writer.writerow({k: row.get(k) for k in fields})


def main() -> None:
  parser = argparse.ArgumentParser(description="Benchmark MCMF vs Greedy on generated scenarios")
  parser.add_argument(
    "--input",
    default=str(ROOT / "data" / "synthetic_input.json"),
    help="Path to base input JSON",
  )
  parser.add_argument("--scenarios", type=int, default=100, help="Number of random scenarios")
  parser.add_argument("--seed", type=int, default=42, help="Random seed")
  parser.add_argument(
    "--output-dir",
    default=str(ROOT / "benchmark" / "results"),
    help="Directory for CSV/JSON output",
  )
  parser.add_argument(
    "--plot",
    action="store_true",
    help="Also generate plots by calling plot_benchmark.py",
  )
  args = parser.parse_args()

  rng = random.Random(args.seed)
  input_path = Path(args.input)
  output_dir = Path(args.output_dir)
  output_dir.mkdir(parents=True, exist_ok=True)

  base_teachers, base_schools = load_input(input_path)

  rows: List[Dict[str, Any]] = []
  for i in range(args.scenarios):
    teachers, schools, blocked = generate_scenario(base_teachers, base_schools, rng)

    mcmf_start = time.perf_counter()
    mcmf = run_reoptimizer(
      teachers=teachers,
      schools=schools,
      old_allocation={},
      blocked_routes=blocked,
      delta_km=0.0,
      urgency="medium",
    )
    mcmf_ms = (time.perf_counter() - mcmf_start) * 1000.0

    greedy_start = time.perf_counter()
    greedy_allocs = run_greedy_baseline(teachers, schools, blocked)
    greedy_kpi = compute_kpi(teachers, schools, greedy_allocs)
    greedy_ms = (time.perf_counter() - greedy_start) * 1000.0

    mcmf_kpi = mcmf["kpi"]
    greedy_cov = float(greedy_kpi["coverage_pct"])
    mcmf_cov = float(mcmf_kpi["coverage_pct"])
    greedy_travel = float(greedy_kpi["total_travel_km"])
    mcmf_travel = float(mcmf_kpi["total_travel_km"])

    travel_reduction_pct = 0.0
    if greedy_travel > 0:
      travel_reduction_pct = ((greedy_travel - mcmf_travel) / greedy_travel) * 100.0

    runtime_ratio = mcmf_ms / greedy_ms if greedy_ms > 0 else 0.0

    rows.append(
      {
        "scenario_id": i + 1,
        "seed": args.seed,
        "total_demand_hours": total_demand_hours(schools),
        "active_teachers": sum(1 for t in teachers.values() if t.get("active", True)),
        "active_schools": sum(1 for s in schools.values() if s.get("active", True)),
        "blocked_routes": len(blocked),
        "mcmf_coverage": round(mcmf_cov, 3),
        "greedy_coverage": round(greedy_cov, 3),
        "coverage_gain_pp": round(mcmf_cov - greedy_cov, 3),
        "mcmf_travel_km": round(mcmf_travel, 3),
        "greedy_travel_km": round(greedy_travel, 3),
        "travel_reduction_pct": round(travel_reduction_pct, 3),
        "mcmf_workload_std": float(mcmf_kpi["workload_std"]),
        "greedy_workload_std": float(greedy_kpi["workload_std"]),
        "fairness_gain": round(float(greedy_kpi["workload_std"]) - float(mcmf_kpi["workload_std"]), 3),
        "mcmf_runtime_ms": round(mcmf_ms, 3),
        "greedy_runtime_ms": round(greedy_ms, 3),
        "runtime_ratio": round(runtime_ratio, 3),
        "mcmf_unmet_slots": len(mcmf_kpi["unmet_demand"]),
        "greedy_unmet_slots": len(greedy_kpi["unmet_demand"]),
      }
    )

  summary = summarize(rows)

  csv_path = output_dir / "benchmark_runs.csv"
  json_path = output_dir / "benchmark_summary.json"

  write_csv(csv_path, rows)
  with json_path.open("w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)

  print(f"[ok] Wrote: {csv_path}")
  print(f"[ok] Wrote: {json_path}")
  print(json.dumps(summary, indent=2))

  if args.plot:
    import subprocess

    plot_script = ROOT / "benchmark" / "plot_benchmark.py"
    subprocess.run(
      [
        sys.executable,
        str(plot_script),
        "--csv",
        str(csv_path),
        "--output-dir",
        str(output_dir),
      ],
      check=True,
    )


if __name__ == "__main__":
  main()
