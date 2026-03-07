# Dynamic Teacher Allocation Backend

Python/Flask backend for event-driven teacher re-allocation with switching cost.

## Features
- Stateful allocation manager (`current_allocation`, `pending_changes`, `history`, `events`)
- Event handling for teacher/school/constraint updates
- SPFA-based min-cost max-flow re-optimizer with switching penalty
- Automatic re-optimize policy:
  - immediate when any pending event is `high` urgency
  - otherwise when pending event count >= `BATCH_THRESHOLD` (default `3`)

## Run
From project root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r dynamic_backend/requirements.txt
MAX_DISTANCE_KM=0 python dynamic_backend/app.py
```

Default API base URL: `http://localhost:5000`

Distance constraint:
- `MAX_DISTANCE_KM` controls the max teacher-school arc distance for MCMF.
- Default is `0` (unlimited, coverage-first).
- Set `MAX_DISTANCE_KM=100` (or another positive value) when you want to trade some coverage for lower travel.

## API
- `GET /health`
- `GET /dashboard/` (serve integrated dashboard)
- `GET /api/optimizer/current`
- `POST /api/optimizer/json`
- `POST /api/optimizer/csv`
- `GET /api/optimizer/csv-template`
- `GET /state`
- `GET /allocation`
- `GET /events?limit=100`
- `GET /history?limit=50`
- `POST /events`
- `POST /reoptimize`
- `POST /reset`

### POST /events payload
Either pass event directly:

```json
{ "type": "teacher_quit", "teacher_id": "T1" }
```

or wrapped payload:

```json
{
  "event": { "type": "demand_increase", "school_id": "S6", "subject": "IT", "delta_hours": 3 },
  "auto_reoptimize": true
}
```

## Supported event types
- `teacher_quit`
- `teacher_sick`
- `teacher_new`
- `capacity_change`
- `demand_increase`
- `demand_decrease`
- `school_new`
- `school_close`
- `road_blocked`
- `priority_change`

## Replay sample events
```bash
python dynamic_backend/replay_events.py --auto-reoptimize
```

Sample events file: `data/dynamic_events.json`.

## Integrated flow: CSV/JSON web input -> C++ optimizer
Run:

```bash
make
source .venv/bin/activate
pip install -r dynamic_backend/requirements.txt
MAX_DISTANCE_KM=0 PORT=5001 python dynamic_backend/app.py
```

Open dashboard:
- `http://127.0.0.1:5001/dashboard/`

The dashboard now supports:
- Manual JSON edit + rerun C++ allocator
- CSV upload (Python converts CSV -> JSON)

Generated files:
- `data/web_input.json`
- `output/web_latest/allocation_mcmf.json`
- `output/web_latest/allocation_greedy.json`
- `output/web_latest/allocation.json`

CSV row types:
- `teacher` rows: `id,name,capacity,subjects,lat,lng`
- `school` rows: `id,name,priority,lat,lng`
- `demand` rows: `school_id,subject,hours`
