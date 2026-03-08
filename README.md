# Soda Hackathon - Teacher Allocation Optimizer

## Architecture
Web UI (Next.js) -> Flask API -> C++ Core Engine (MCMF + Greedy baseline + KPI) -> JSON results -> Next.js statistics dashboard

## Project structure
- `src/main.cpp`: app entrypoint
- `src/mcmf.*`: SPFA-based min-cost max-flow solver
- `src/graph_builder.*`: flow graph construction with dummy teacher
- `src/greedy_baseline.*`: nearest-teacher baseline
- `src/kpi.*`: coverage/travel/fairness metrics
- `src/io.*`: JSON input/output
- `data/synthetic_input.json`: sample dataset (10 teachers, 8 schools, 4 subjects)
- `app/`: Next.js frontend pages (`/` landing, `/form` input, `/statistics` results)
- `components/`: React UI components (map, charts, KPI cards, forms)
- `lib/`: TypeScript API client, types, and utilities
- `dynamic_backend/`: Python Flask API server

## Git LFS Setup (Required)
This project uses Git Large File Storage (LFS) for media assets. You must install Git LFS and pull the actual files before running the app.

1.  **Install Git LFS**:
    ```bash
    brew install git-lfs
    git lfs install
    ```

2.  **Pull LFS files**:
    ```bash
    git lfs pull
    ```

## Running the app
Prerequisites: C++17 compiler, Node.js, Python 3.

### Step 1 — Build the C++ solver
```bash
make
```

### Step 2 — Start the Flask backend (port 5001)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r dynamic_backend/requirements.txt
MAX_DISTANCE_KM=0 PORT=5001 python dynamic_backend/app.py
```

### Step 3 — Start the Next.js frontend (port 3000)
In a separate terminal:
```bash
npm install
npm run dev
```

Open: **`http://localhost:3000`**

The Next.js app proxies all `/api/*` requests to the Flask backend on port 5001.

### Pages
- `/` — Landing page
- `/form` — Input teachers & schools (manual form or CSV upload), then run the optimizer
- `/statistics` — View KPI cards, comparison charts, allocation map, and allocation table

## C++ solver options
Optional: set max teacher-school distance (km) for MCMF edges:

```bash
./bin/allocator data/synthetic_input.json output 100
```

Notes:
- Only arcs with distance `<= max_distance_km` are considered by MCMF.
- Coverage-first default is unlimited distance (`0`).
- Set a positive value (for example `100`) to reduce travel at the cost of coverage.

Generated files:
- `output/web_latest/allocation_mcmf.json`
- `output/web_latest/allocation_greedy.json`
- `output/web_latest/allocation.json`

### CSV format for upload
Header:

```csv
entity,id,name,capacity,subjects,lat,lng,priority,school_id,subject,hours
```

Supported row types:
- `teacher`: use `id,name,capacity,subjects,lat,lng` (`subjects` split by `|`, `,`, or `;`)
- `school`: use `id,name,priority,lat,lng`
- `demand`: use `school_id,subject,hours`

Download template:
- `http://127.0.0.1:5001/api/optimizer/csv-template`

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
