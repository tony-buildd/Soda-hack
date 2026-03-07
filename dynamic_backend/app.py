from __future__ import annotations

import csv
import io
import json
import os
import re
import subprocess
import threading
from pathlib import Path
from typing import Any, Dict, List

from flask import Flask, Response, jsonify, redirect, request, send_from_directory, url_for

try:
  from .state_manager import AllocationState
except ImportError:
  from state_manager import AllocationState


CSV_TEMPLATE = """entity,id,name,capacity,subjects,lat,lng,priority,school_id,subject,hours
teacher,T1,Nguyen Van A,20,Math|Physics,21.03,105.85,,,,
teacher,T2,Tran Thi B,18,English|IT,21.05,105.81,,,,
school,S1,THPT Son La,,,21.32,103.91,3,,,
school,S2,THPT Moc Chau,,,20.83,104.75,2,,,
demand,,,,,,,,S1,Math,10
demand,,,,,,,,S1,English,8
demand,,,,,,,,S2,IT,6
"""


def _parse_int(value: str, field: str) -> int:
  try:
    return int(value)
  except (TypeError, ValueError):
    raise ValueError(f"Invalid integer for '{field}': {value!r}")


def _parse_float(value: str, field: str) -> float:
  try:
    return float(value)
  except (TypeError, ValueError):
    raise ValueError(f"Invalid number for '{field}': {value!r}")


def _split_subjects(raw: str | List[str]) -> List[str]:
  if isinstance(raw, list):
    out = [str(item).strip() for item in raw if str(item).strip()]
    if not out:
      raise ValueError("Teacher subjects cannot be empty")
    return out

  value = str(raw).strip()
  if not value:
    raise ValueError("Teacher subjects cannot be empty")

  return [part.strip() for part in re.split(r"[|;,]", value) if part.strip()]


def _normalize_input_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
  if not isinstance(payload, dict):
    raise ValueError("Input payload must be a JSON object")
  if "teachers" not in payload or "schools" not in payload:
    raise ValueError("Input must include both 'teachers' and 'schools'")
  if not isinstance(payload["teachers"], list) or not isinstance(payload["schools"], list):
    raise ValueError("'teachers' and 'schools' must both be arrays")

  normalized_teachers: List[Dict[str, Any]] = []
  normalized_schools: List[Dict[str, Any]] = []

  for idx, teacher in enumerate(payload["teachers"], start=1):
    if not isinstance(teacher, dict):
      raise ValueError(f"Teacher at index {idx} must be an object")
    teacher_id = str(teacher.get("id", "")).strip()
    if not teacher_id:
      raise ValueError(f"Teacher at index {idx} is missing 'id'")

    base = teacher.get("base", [])
    if not isinstance(base, list) or len(base) != 2:
      raise ValueError(f"Teacher '{teacher_id}' must have base [lat, lng]")

    normalized_teachers.append(
      {
        "id": teacher_id,
        "name": str(teacher.get("name", teacher_id)).strip() or teacher_id,
        "capacity": _parse_int(str(teacher.get("capacity", "")), f"teachers[{idx}].capacity"),
        "subjects": _split_subjects(teacher.get("subjects", [])),
        "base": [
          _parse_float(str(base[0]), f"teachers[{idx}].base[0]"),
          _parse_float(str(base[1]), f"teachers[{idx}].base[1]"),
        ],
      }
    )

  for idx, school in enumerate(payload["schools"], start=1):
    if not isinstance(school, dict):
      raise ValueError(f"School at index {idx} must be an object")
    school_id = str(school.get("id", "")).strip()
    if not school_id:
      raise ValueError(f"School at index {idx} is missing 'id'")

    location = school.get("location", [])
    if not isinstance(location, list) or len(location) != 2:
      raise ValueError(f"School '{school_id}' must have location [lat, lng]")

    demand_raw = school.get("demand", {})
    if not isinstance(demand_raw, dict):
      raise ValueError(f"School '{school_id}' demand must be an object")
    demand: Dict[str, int] = {}
    for subject, hours in demand_raw.items():
      subject_name = str(subject).strip()
      if not subject_name:
        continue
      demand[subject_name] = _parse_int(str(hours), f"schools[{idx}].demand.{subject_name}")

    normalized_schools.append(
      {
        "id": school_id,
        "name": str(school.get("name", school_id)).strip() or school_id,
        "priority": _parse_int(str(school.get("priority", "1")), f"schools[{idx}].priority"),
        "location": [
          _parse_float(str(location[0]), f"schools[{idx}].location[0]"),
          _parse_float(str(location[1]), f"schools[{idx}].location[1]"),
        ],
        "demand": demand,
      }
    )

  if not normalized_teachers:
    raise ValueError("At least one teacher is required")
  if not normalized_schools:
    raise ValueError("At least one school is required")

  return {"teachers": normalized_teachers, "schools": normalized_schools}


def _parse_csv_input(csv_text: str) -> Dict[str, Any]:
  text = csv_text.lstrip("\ufeff").strip()
  if not text:
    raise ValueError("CSV file is empty")

  reader = csv.DictReader(io.StringIO(text))
  if not reader.fieldnames:
    raise ValueError("CSV must include a header row")

  teachers: Dict[str, Dict[str, Any]] = {}
  schools: Dict[str, Dict[str, Any]] = {}

  for row_no, row in enumerate(reader, start=2):
    normalized_row = {
      (key or "").strip().lower(): (value or "").strip() for key, value in row.items()
    }

    if not any(normalized_row.values()):
      continue

    entity = (
      normalized_row.get("entity")
      or normalized_row.get("type")
      or normalized_row.get("row_type")
      or ""
    ).strip().lower()
    if not entity:
      raise ValueError(
        f"CSV row {row_no}: missing 'entity' (use teacher/school/demand)"
      )

    if entity == "teacher":
      teacher_id = normalized_row.get("id", "")
      if not teacher_id:
        raise ValueError(f"CSV row {row_no}: teacher row missing 'id'")
      if teacher_id in teachers:
        raise ValueError(f"CSV row {row_no}: duplicate teacher id '{teacher_id}'")

      lat = normalized_row.get("base_lat") or normalized_row.get("lat")
      lng = normalized_row.get("base_lng") or normalized_row.get("lng")
      if not lat or not lng:
        raise ValueError(
          f"CSV row {row_no}: teacher '{teacher_id}' requires lat/lng (or base_lat/base_lng)"
        )

      teachers[teacher_id] = {
        "id": teacher_id,
        "name": normalized_row.get("name") or teacher_id,
        "capacity": _parse_int(normalized_row.get("capacity", ""), "capacity"),
        "subjects": _split_subjects(normalized_row.get("subjects", "")),
        "base": [_parse_float(lat, "lat"), _parse_float(lng, "lng")],
      }
      continue

    if entity == "school":
      school_id = normalized_row.get("id", "")
      if not school_id:
        raise ValueError(f"CSV row {row_no}: school row missing 'id'")
      if school_id in schools:
        raise ValueError(f"CSV row {row_no}: duplicate school id '{school_id}'")

      lat = normalized_row.get("location_lat") or normalized_row.get("lat")
      lng = normalized_row.get("location_lng") or normalized_row.get("lng")
      if not lat or not lng:
        raise ValueError(
          f"CSV row {row_no}: school '{school_id}' requires lat/lng (or location_lat/location_lng)"
        )

      school = {
        "id": school_id,
        "name": normalized_row.get("name") or school_id,
        "priority": _parse_int(normalized_row.get("priority", "1"), "priority"),
        "location": [_parse_float(lat, "lat"), _parse_float(lng, "lng")],
        "demand": {},
      }

      for key, value in normalized_row.items():
        if not key.startswith("demand_") or not value:
          continue
        subject = key[len("demand_") :].strip()
        if subject:
          school["demand"][subject] = _parse_int(value, key)

      schools[school_id] = school
      continue

    if entity == "demand":
      school_id = normalized_row.get("school_id", "")
      if not school_id:
        raise ValueError(f"CSV row {row_no}: demand row missing 'school_id'")
      if school_id not in schools:
        raise ValueError(
          f"CSV row {row_no}: demand references unknown school '{school_id}'. "
          "Define the school row first."
        )

      subject = normalized_row.get("subject", "")
      if not subject:
        raise ValueError(f"CSV row {row_no}: demand row missing 'subject'")
      hours = _parse_int(normalized_row.get("hours", ""), "hours")

      schools[school_id]["demand"][subject] = (
        schools[school_id]["demand"].get(subject, 0) + hours
      )
      continue

    raise ValueError(
      f"CSV row {row_no}: unsupported entity '{entity}'. Use teacher, school or demand."
    )

  payload = {"teachers": list(teachers.values()), "schools": list(schools.values())}
  return _normalize_input_payload(payload)


def create_app() -> Flask:
  app = Flask(__name__)

  project_root = Path(__file__).resolve().parents[1]
  dashboard_dir = project_root / "dashboard"
  default_input = project_root / "data" / "synthetic_input.json"
  web_input = project_root / "data" / "web_input.json"
  web_output_dir = project_root / "output" / "web_latest"
  allocator_binary = project_root / "bin" / "allocator"

  input_path = os.environ.get("INPUT_PATH", str(default_input))
  batch_threshold = int(os.environ.get("BATCH_THRESHOLD", "3"))
  max_distance_km = float(os.environ.get("MAX_DISTANCE_KM", "0"))
  state = AllocationState(
    input_path=input_path,
    batch_threshold=batch_threshold,
    max_distance_km=(None if max_distance_km <= 0 else max_distance_km),
  )

  state_lock = threading.Lock()
  optimizer_lock = threading.Lock()

  def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))

  def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

  def _ensure_allocator_binary() -> None:
    if allocator_binary.exists():
      return

    build = subprocess.run(
      ["make", "all"], cwd=project_root, capture_output=True, text=True, check=False
    )
    if build.returncode != 0:
      error_lines = [line for line in [build.stdout.strip(), build.stderr.strip()] if line]
      raise RuntimeError("Failed to build C++ allocator.\n" + "\n".join(error_lines))
    if not allocator_binary.exists():
      raise RuntimeError("C++ allocator build finished but binary was not found at bin/allocator")

  def _load_results_from_disk(input_payload: Dict[str, Any]) -> Dict[str, Any]:
    mcmf_path = web_output_dir / "allocation_mcmf.json"
    greedy_path = web_output_dir / "allocation_greedy.json"
    if not mcmf_path.exists() or not greedy_path.exists():
      raise FileNotFoundError("Allocation output files do not exist yet")

    return {
      "input": input_payload,
      "mcmf": _read_json(mcmf_path),
      "greedy": _read_json(greedy_path),
    }

  def _run_allocator(input_payload: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_allocator_binary()
    _write_json(web_input, input_payload)
    web_output_dir.mkdir(parents=True, exist_ok=True)

    run = subprocess.run(
      [
        str(allocator_binary),
        str(web_input),
        str(web_output_dir),
        str(max_distance_km),
      ],
      cwd=project_root,
      capture_output=True,
      text=True,
      check=False,
    )
    if run.returncode != 0:
      error_lines = [line for line in [run.stdout.strip(), run.stderr.strip()] if line]
      raise RuntimeError("C++ allocator failed.\n" + "\n".join(error_lines))

    out = _load_results_from_disk(input_payload)
    out["meta"] = {"log": run.stdout, "max_distance_km": max_distance_km}
    return out

  def _load_or_bootstrap_current() -> Dict[str, Any]:
    if web_input.exists():
      input_payload = _normalize_input_payload(_read_json(web_input))
    else:
      input_payload = _normalize_input_payload(_read_json(default_input))
      _write_json(web_input, input_payload)

    try:
      return _load_results_from_disk(input_payload)
    except FileNotFoundError:
      return _run_allocator(input_payload)

  @app.get("/")
  def home() -> Any:
    return redirect(url_for("dashboard_index"))

  @app.get("/dashboard/")
  def dashboard_index() -> Any:
    return send_from_directory(dashboard_dir, "index.html")

  @app.get("/dashboard/<path:asset_path>")
  def dashboard_assets(asset_path: str) -> Any:
    return send_from_directory(dashboard_dir, asset_path)

  @app.get("/health")
  def health() -> Any:
    return jsonify({"status": "ok"})

  @app.get("/api/optimizer/csv-template")
  def get_csv_template() -> Any:
    return Response(
      CSV_TEMPLATE,
      mimetype="text/csv",
      headers={"Content-Disposition": "attachment; filename=input_template.csv"},
    )

  @app.get("/api/optimizer/current")
  def get_optimizer_current() -> Any:
    try:
      with optimizer_lock:
        return jsonify(_load_or_bootstrap_current())
    except Exception as exc:
      return jsonify({"error": str(exc)}), 500

  @app.post("/api/optimizer/json")
  def post_optimizer_json() -> Any:
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    raw_input = payload.get("input", payload)

    try:
      input_payload = _normalize_input_payload(raw_input)
      with optimizer_lock:
        return jsonify(_run_allocator(input_payload))
    except ValueError as exc:
      return jsonify({"error": str(exc)}), 400
    except Exception as exc:
      return jsonify({"error": str(exc)}), 500

  @app.post("/api/optimizer/csv")
  def post_optimizer_csv() -> Any:
    upload = request.files.get("file")
    csv_text = ""

    if upload is not None:
      csv_text = upload.stream.read().decode("utf-8-sig")
    else:
      payload: Dict[str, Any] = request.get_json(silent=True) or {}
      csv_text = str(payload.get("csv", ""))

    try:
      input_payload = _parse_csv_input(csv_text)
      with optimizer_lock:
        return jsonify(_run_allocator(input_payload))
    except ValueError as exc:
      return jsonify({"error": str(exc)}), 400
    except Exception as exc:
      return jsonify({"error": str(exc)}), 500

  @app.get("/state")
  def get_state() -> Any:
    with state_lock:
      return jsonify(state.snapshot())

  @app.get("/allocation")
  def get_allocation() -> Any:
    with state_lock:
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
    with state_lock:
      return jsonify({"history": state.history[-limit:]})

  @app.get("/events")
  def get_events() -> Any:
    limit = int(request.args.get("limit", "100"))
    limit = max(1, min(limit, 1000))
    with state_lock:
      return jsonify({"events": state.events[-limit:]})

  @app.post("/events")
  def post_event() -> Any:
    payload: Dict[str, Any] = request.get_json(silent=True) or {}

    auto_reoptimize = bool(payload.get("auto_reoptimize", True))
    event = payload.get("event", payload)

    if not isinstance(event, dict) or "type" not in event:
      return jsonify({"error": "Request must contain event with type"}), 400

    try:
      with state_lock:
        result = state.ingest_event(event, auto_reoptimize=auto_reoptimize)
      return jsonify(result)
    except ValueError as exc:
      return jsonify({"error": str(exc)}), 400

  @app.post("/reoptimize")
  def post_reoptimize() -> Any:
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    urgency = payload.get("urgency")

    with state_lock:
      result = state.reoptimize(trigger="manual", urgency=urgency)
    return jsonify(result)

  @app.post("/reset")
  def post_reset() -> Any:
    payload: Dict[str, Any] = request.get_json(silent=True) or {}
    new_input = payload.get("input_path")

    with state_lock:
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
