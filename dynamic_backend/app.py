from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any, Dict

from flask import Flask, jsonify, request

try:
  from .state_manager import AllocationState
except ImportError:
  from state_manager import AllocationState


def create_app() -> Flask:
  app = Flask(__name__)

  project_root = Path(__file__).resolve().parents[1]
  default_input = project_root / "data" / "synthetic_input.json"
  input_path = os.environ.get("INPUT_PATH", str(default_input))

  batch_threshold = int(os.environ.get("BATCH_THRESHOLD", "3"))
  state = AllocationState(input_path=input_path, batch_threshold=batch_threshold)
  lock = threading.Lock()

  @app.get("/health")
  def health() -> Any:
    return jsonify({"status": "ok"})

  @app.get("/state")
  def get_state() -> Any:
    with lock:
      return jsonify(state.snapshot())

  @app.get("/allocation")
  def get_allocation() -> Any:
    with lock:
      return jsonify(
        {
          "allocations": state.allocation_list(),
          "kpi": state.snapshot()["kpi"],
          "pending_changes": state.pending_changes,
        }
      )

  @app.get("/history")
  def get_history() -> Any:
    limit = int(request.args.get("limit", "50"))
    limit = max(1, min(limit, 500))
    with lock:
      return jsonify({"history": state.history[-limit:]})

  @app.get("/events")
  def get_events() -> Any:
    limit = int(request.args.get("limit", "100"))
    limit = max(1, min(limit, 1000))
    with lock:
      return jsonify({"events": state.events[-limit:]})

  @app.post("/events")
  def post_event() -> Any:
    payload: Dict[str, Any] = request.get_json(silent=True) or {}

    auto_reoptimize = bool(payload.get("auto_reoptimize", True))
    event = payload.get("event", payload)

    if not isinstance(event, dict) or "type" not in event:
      return jsonify({"error": "Request must contain event with type"}), 400

    try:
      with lock:
        result = state.ingest_event(event, auto_reoptimize=auto_reoptimize)
      return jsonify(result)
    except ValueError as exc:
      return jsonify({"error": str(exc)}), 400

  @app.post("/reoptimize")
  def post_reoptimize() -> Any:
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    urgency = payload.get("urgency")

    with lock:
      result = state.reoptimize(trigger="manual", urgency=urgency)
    return jsonify(result)

  @app.post("/reset")
  def post_reset() -> Any:
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    new_input = payload.get("input_path")

    with lock:
      result = state.load_from_input(new_input)
      snapshot = state.snapshot()

    return jsonify({"reset": result, "state": snapshot})

  return app


app = create_app()


if __name__ == "__main__":
  host = os.environ.get("HOST", "0.0.0.0")
  port = int(os.environ.get("PORT", "5000"))
  debug = os.environ.get("DEBUG", "false").lower() == "true"
  app.run(host=host, port=port, debug=debug)
