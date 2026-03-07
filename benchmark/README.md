# Benchmark Toolkit

Compare `MCMF` vs `Greedy` across many randomized scenarios.

## Setup

```bash
source .venv/bin/activate
pip install -r benchmark/requirements.txt
```

## Run benchmark + plots

```bash
python benchmark/run_benchmark.py --scenarios 100 --seed 42 --plot
```

Outputs in `benchmark/results/`:
- `benchmark_runs.csv`
- `benchmark_summary.json`
- `benchmark_summary.md`
- `benchmark_comparison.png`
- `travel_reduction_hist.png`

## Notebook report
Open:
- `benchmark/benchmark_report.ipynb`

Notebook reads:
- `benchmark/results/benchmark_runs.csv`
