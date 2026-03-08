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
    
    > **Note**: If the background video on the landing page is not loading (or shows a small file size), verify that you have pulled the LFS files correctly. The file `public/vietnam_background.mp4` should be approximately 127MB.

3.  **Troubleshooting Large File Push Errors**:
    If you encounter an error like `GH001: Large files detected` when pushing:
    - Ensure you have Git LFS installed (`brew install git-lfs`).
    - Run `git lfs install` in your repo.
    - Check `.gitattributes` tracks the large file (e.g., `*.mp4 filter=lfs diff=lfs merge=lfs -text`).
    - If you already committed a large file without LFS, you may need to rewrite history or remove the file from history before pushing.

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
pip install -r requirements.txt
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

## Integrated Web Input -> CSV/JSON -> C++ Solve
You can now run one integrated flow:
- Input from web (manual JSON or CSV upload)
- Python converts CSV to JSON
- C++ solver runs on generated JSON
- Dashboard updates KPI/map/allocation immediately

Run from project root:

```bash
make
source .venv/bin/activate
pip install -r requirements.txt
MAX_DISTANCE_KM=0 PORT=5001 python dynamic_backend/app.py
```

Notes:
- Only arcs with distance `<= max_distance_km` are considered by MCMF.
- Coverage-first default is unlimited distance (`0`).
- Set a positive value (for example `100`) to reduce travel at the cost of coverage.

Generated files:
- `output/web_latest/allocation_mcmf.json`
- `output/web_latest/allocation_greedy.json`
- `output/web_latest/allocation.json`

When calling:
- `POST /api/optimizer/json`
- `POST /api/optimizer/csv`

the response now also includes `meta.input_diff`:
- `summary`: inferred change counts + `effective_urgency`
  (calculated from demand/capacity impact magnitude, not only event type)
- `events`: auto-detected events from previous input -> new input

Important:
- For `POST /api/optimizer/json` and `POST /api/optimizer/csv`, `effective_urgency` is metadata for monitoring/UI and does not change C++ optimizer objective.
- Urgency affects optimization only in event-driven re-optimization (`/events`, `/reoptimize`) via switching-penalty logic in Python reoptimizer.

### CSV format for upload
The download template is the combined single-file format:

```csv
entity,id,name,capacity,subjects,lat,lng,priority,school_id,subject,hours
```

Supported row types:
- `teacher`: use `id,name,capacity,subjects,lat,lng` (`subjects` split by `|`, `,`, or `;`)
- `school`: use `id,name,priority,lat,lng`
- `demand`: use `school_id,subject,hours`

The backend also accepts separate district export files such as:
- `teachers_hagiang.csv` / `teachers_laichau.csv`
- `schools_hagiang.csv` / `schools_laichau.csv`

If you use separate teacher and school files, upload both together so the optimizer has both sides of the input.

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
