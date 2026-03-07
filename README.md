# Soda Hackathon - Teacher Allocation Optimizer

## Architecture
Input JSON -> C++ Core Engine (MCMF + Greedy baseline + KPI) -> output JSON -> static dashboard (Leaflet + Chart.js)

## Project structure
- `src/main.cpp`: app entrypoint
- `src/mcmf.*`: SPFA-based min-cost max-flow solver
- `src/graph_builder.*`: flow graph construction with dummy teacher
- `src/greedy_baseline.*`: nearest-teacher baseline
- `src/kpi.*`: coverage/travel/fairness metrics
- `src/io.*`: JSON input/output
- `data/synthetic_input.json`: sample dataset (10 teachers, 8 schools, 4 subjects)
- `dashboard/`: static web dashboard

## Build and run
Prerequisite: C++17 compiler. `nlohmann/json` is vendored at `third_party/nlohmann/json.hpp`.

```bash
make
make run
```

Generated files:
- `output/allocation_mcmf.json`
- `output/allocation_greedy.json`
- `output/allocation.json` (alias of MCMF output)

## Open dashboard
From project root:

```bash
python -m http.server 8000
```

Then open:
- `http://localhost:8000/dashboard/`

The dashboard loads:
- `data/synthetic_input.json`
- `output/allocation_mcmf.json`
- `output/allocation_greedy.json`

## Dynamic backend (event-driven re-allocation)
`dynamic_backend/` provides a Python Flask service for dynamic teacher allocation with switching cost.

Quick start:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r dynamic_backend/requirements.txt
python dynamic_backend/app.py
```

See API and event schema in `dynamic_backend/README.md`.

## Benchmark and plots (MCMF vs Greedy)
Run multi-scenario benchmark and generate comparison charts:

```bash
source .venv/bin/activate
pip install -r benchmark/requirements.txt
python benchmark/run_benchmark.py --scenarios 100 --seed 42 --plot
```

Outputs:
- `benchmark/results/benchmark_runs.csv`
- `benchmark/results/benchmark_summary.json`
- `benchmark/results/benchmark_summary.md`
- `benchmark/results/benchmark_comparison.png`
- `benchmark/results/travel_reduction_hist.png`

Notebook report:
- `benchmark/benchmark_report.ipynb`

## JSON contract
Input format (simplified):

```json
{
  "teachers": [
    {
      "id": "T1",
      "name": "Nguyen Van A",
      "capacity": 20,
      "subjects": ["Math", "Physics"],
      "base": [21.03, 105.85]
    }
  ],
  "schools": [
    {
      "id": "S1",
      "name": "THPT Son La",
      "priority": 3,
      "location": [21.32, 103.91],
      "demand": { "Math": 10, "English": 8 }
    }
  ]
}
```

Output format:

```json
{
  "allocations": [
    { "teacher": "T1", "school": "S1", "subject": "Math", "hours": 10 }
  ],
  "kpi": {
    "coverage_pct": 87.5,
    "total_travel_km": 340,
    "workload_std": 2.3,
    "unmet_demand": [
      { "school": "S1", "subject": "English", "missing_hours": 3 }
    ]
  }
}
```
