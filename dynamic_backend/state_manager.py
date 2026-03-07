from __future__ import annotations

import copy
import json
from collections.abc import Sequence
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

try:
  from .reoptimizer import (
    AllocationNested,
    compute_allocation_diff,
    compute_kpi,
    nested_to_list,
    run_reoptimizer,
  )
except ImportError:
  from reoptimizer import (
    AllocationNested,
    compute_allocation_diff,
    compute_kpi,
    nested_to_list,
    run_reoptimizer,
  )


def now_iso() -> str:
  return datetime.now(tz=timezone.utc).isoformat()


class AllocationState:
  def __init__(self, input_path: str, *, batch_threshold: int = 3) -> None:
    self.input_path = input_path
    self.batch_threshold = batch_threshold

    self.current_allocation: AllocationNested = {}
    self.teachers: Dict[str, Dict[str, Any]] = {}
    self.schools: Dict[str, Dict[str, Any]] = {}
    self.history: List[Dict[str, Any]] = []
    self.pending_changes: List[Dict[str, Any]] = []
    self.events: List[Dict[str, Any]] = []
    self.blocked_routes: Set[Tuple[str, str]] = set()

    self._event_counter = 0
    self._reopt_counter = 0

    self.load_from_input(input_path)

  def load_from_input(self, input_path: Optional[str] = None) -> Dict[str, Any]:
    if input_path is not None:
      self.input_path = input_path

    with open(self.input_path, "r", encoding="utf-8") as f:
      raw = json.load(f)

    self.teachers = {}
    self.schools = {}

    for teacher in raw.get("teachers", []):
      normalized = self._normalize_teacher(teacher)
      self.teachers[normalized["id"]] = normalized

    for school in raw.get("schools", []):
      normalized = self._normalize_school(school)
      self.schools[normalized["id"]] = normalized

    self.current_allocation = {}
    self.history = []
    self.pending_changes = []
    self.events = []
    self.blocked_routes = set()
    self._event_counter = 0
    self._reopt_counter = 0

    bootstrap = self.reoptimize(trigger="bootstrap", urgency="low")
    return {
      "status": "ok",
      "input_path": self.input_path,
      "bootstrap": bootstrap,
    }

  def _normalize_teacher(self, teacher: Dict[str, Any]) -> Dict[str, Any]:
    teacher_id = str(teacher["id"])
    base = teacher.get("base", [0.0, 0.0])
    subjects = [str(s) for s in teacher.get("subjects", [])]
    return {
      "id": teacher_id,
      "name": str(teacher.get("name", teacher_id)),
      "capacity": int(teacher.get("capacity", 0)),
      "subjects": subjects,
      "base": [float(base[0]), float(base[1])],
      "active": bool(teacher.get("active", True)),
      "status": str(teacher.get("status", "active")),
      "created_at": teacher.get("created_at", now_iso()),
      "updated_at": now_iso(),
    }

  def _normalize_school(self, school: Dict[str, Any]) -> Dict[str, Any]:
    school_id = str(school["id"])
    loc = school.get("location", [0.0, 0.0])
    demand = {str(k): max(0, int(v)) for k, v in school.get("demand", {}).items()}
    return {
      "id": school_id,
      "name": str(school.get("name", school_id)),
      "priority": int(school.get("priority", 1)),
      "location": [float(loc[0]), float(loc[1])],
      "demand": demand,
      "active": bool(school.get("active", True)),
      "created_at": school.get("created_at", now_iso()),
      "updated_at": now_iso(),
    }

  def get_assignments(self, teacher_id: str) -> List[Dict[str, Any]]:
    allocations = []
    teacher_map = self.current_allocation.get(teacher_id, {})
    for school_id, subjects in teacher_map.items():
      for subject, hours in subjects.items():
        if int(hours) <= 0:
          continue
        allocations.append(
          {
            "teacher": teacher_id,
            "school": school_id,
            "subject": subject,
            "hours": int(hours),
          }
        )
    allocations.sort(key=lambda x: (x["school"], x["subject"]))
    return allocations

  def _event_urgency(self, event_type: str) -> str:
    if event_type in {"teacher_quit", "school_close", "road_blocked"}:
      return "high"
    if event_type in {"teacher_sick", "demand_increase", "priority_change"}:
      return "medium"
    return "low"

  def apply_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
    event_type = str(event.get("type", "")).strip()
    if not event_type:
      raise ValueError("event.type is required")

    affected_slots: List[Any] = []
    urgency = self._event_urgency(event_type)

    if event_type == "teacher_quit":
      teacher_id = str(event["teacher_id"])
      teacher = self.teachers.get(teacher_id)
      if teacher is None:
        raise ValueError(f"Teacher not found: {teacher_id}")
      affected_slots = self.get_assignments(teacher_id)
      teacher["active"] = False
      teacher["status"] = "quit"
      teacher["updated_at"] = now_iso()

    elif event_type == "teacher_sick":
      teacher_id = str(event["teacher_id"])
      teacher = self.teachers.get(teacher_id)
      if teacher is None:
        raise ValueError(f"Teacher not found: {teacher_id}")
      affected_slots = self.get_assignments(teacher_id)
      if "new_capacity" in event:
        teacher["capacity"] = max(0, int(event["new_capacity"]))
      else:
        teacher["active"] = False
      teacher["status"] = "sick"
      teacher["updated_at"] = now_iso()

    elif event_type == "teacher_new":
      teacher_payload = event.get("teacher")
      if not isinstance(teacher_payload, dict):
        raise ValueError("teacher_new requires event.teacher object")
      teacher = self._normalize_teacher(teacher_payload)
      teacher["active"] = True
      teacher["status"] = "active"
      self.teachers[teacher["id"]] = teacher
      affected_slots = [{"teacher": teacher["id"]}]

    elif event_type == "capacity_change":
      teacher_id = str(event["teacher_id"])
      teacher = self.teachers.get(teacher_id)
      if teacher is None:
        raise ValueError(f"Teacher not found: {teacher_id}")
      if "new_capacity" in event:
        teacher["capacity"] = max(0, int(event["new_capacity"]))
      elif "delta_capacity" in event:
        teacher["capacity"] = max(0, teacher["capacity"] + int(event["delta_capacity"]))
      else:
        raise ValueError("capacity_change requires new_capacity or delta_capacity")
      teacher["updated_at"] = now_iso()
      affected_slots = self.get_assignments(teacher_id)

    elif event_type == "demand_increase":
      school_id = str(event["school_id"])
      subject = str(event["subject"])
      delta = int(event.get("delta_hours", 0))
      if delta <= 0:
        raise ValueError("demand_increase requires delta_hours > 0")
      school = self.schools.get(school_id)
      if school is None:
        raise ValueError(f"School not found: {school_id}")
      school["demand"][subject] = school["demand"].get(subject, 0) + delta
      school["updated_at"] = now_iso()
      affected_slots = [{"school": school_id, "subject": subject, "delta_hours": delta}]

    elif event_type == "demand_decrease":
      school_id = str(event["school_id"])
      subject = str(event["subject"])
      delta = int(event.get("delta_hours", 0))
      if delta <= 0:
        raise ValueError("demand_decrease requires delta_hours > 0")
      school = self.schools.get(school_id)
      if school is None:
        raise ValueError(f"School not found: {school_id}")
      school["demand"][subject] = max(0, school["demand"].get(subject, 0) - delta)
      school["updated_at"] = now_iso()
      affected_slots = [{"school": school_id, "subject": subject, "delta_hours": -delta}]

    elif event_type == "school_new":
      school_payload = event.get("school")
      if not isinstance(school_payload, dict):
        raise ValueError("school_new requires event.school object")
      school = self._normalize_school(school_payload)
      school["active"] = True
      self.schools[school["id"]] = school
      affected_slots = [{"school": school["id"]}]

    elif event_type == "school_close":
      school_id = str(event["school_id"])
      school = self.schools.get(school_id)
      if school is None:
        raise ValueError(f"School not found: {school_id}")
      school["active"] = False
      school["updated_at"] = now_iso()
      affected_slots = [{"school": school_id}]

    elif event_type == "road_blocked":
      routes: List[Tuple[str, str]] = []
      if "teacher_id" in event and "school_id" in event:
        routes.append((str(event["teacher_id"]), str(event["school_id"])))
      for pair in event.get("routes", []):
        if isinstance(pair, Sequence) and len(pair) == 2:
          routes.append((str(pair[0]), str(pair[1])))
      if not routes:
        raise ValueError("road_blocked requires teacher_id+school_id or routes")
      for route in routes:
        self.blocked_routes.add(route)
      affected_slots = [{"teacher": t, "school": s} for t, s in routes]

    elif event_type == "priority_change":
      school_id = str(event["school_id"])
      new_priority = int(event["new_priority"])
      school = self.schools.get(school_id)
      if school is None:
        raise ValueError(f"School not found: {school_id}")
      school["priority"] = new_priority
      school["updated_at"] = now_iso()
      affected_slots = [{"school": school_id, "new_priority": new_priority}]

    else:
      raise ValueError(f"Unsupported event type: {event_type}")

    self._event_counter += 1
    event_record = {
      "id": self._event_counter,
      "type": event_type,
      "payload": copy.deepcopy(event),
      "triggered_at": now_iso(),
      "resolved_at": None,
    }
    self.events.append(event_record)

    pending = {
      "event_id": event_record["id"],
      "type": "realloc_needed",
      "reason": event_type,
      "affected_slots": affected_slots,
      "urgency": urgency,
      "queued_at": now_iso(),
    }
    self.pending_changes.append(pending)

    return {
      "event": event_record,
      "pending_change": pending,
    }

  def should_reoptimize(self) -> bool:
    high_urgency = any(c.get("urgency") == "high" for c in self.pending_changes)
    return high_urgency or len(self.pending_changes) >= self.batch_threshold

  def _effective_urgency(self) -> str:
    if any(c.get("urgency") == "high" for c in self.pending_changes):
      return "high"
    if any(c.get("urgency") == "medium" for c in self.pending_changes):
      return "medium"
    return "low"

  def reoptimize(self, *, trigger: str, urgency: Optional[str] = None) -> Dict[str, Any]:
    old_allocation = copy.deepcopy(self.current_allocation)
    kpi_before = compute_kpi(self.teachers, self.schools, nested_to_list(old_allocation))

    effective_urgency = urgency or self._effective_urgency()
    result = run_reoptimizer(
      teachers=self.teachers,
      schools=self.schools,
      old_allocation=old_allocation,
      blocked_routes=self.blocked_routes,
      urgency=effective_urgency,
    )

    new_allocation = result["allocation"]
    diff = compute_allocation_diff(old_allocation, new_allocation)

    self.current_allocation = new_allocation
    kpi_after = result["kpi"]

    self._reopt_counter += 1
    pending_snapshot = copy.deepcopy(self.pending_changes)
    touched_event_ids = sorted({int(c["event_id"]) for c in self.pending_changes if "event_id" in c})

    history_entry = {
      "id": self._reopt_counter,
      "timestamp": now_iso(),
      "trigger": trigger,
      "pending_changes": pending_snapshot,
      "changes": diff,
      "kpi_before": kpi_before,
      "kpi_after": kpi_after,
      "solver": result["solver"],
    }
    self.history.append(history_entry)

    for e in self.events:
      if int(e["id"]) in touched_event_ids:
        e["resolved_at"] = history_entry["timestamp"]

    self.pending_changes = []

    return {
      "history_id": history_entry["id"],
      "trigger": trigger,
      "urgency": effective_urgency,
      "changes": diff,
      "kpi_before": kpi_before,
      "kpi_after": kpi_after,
      "solver": result["solver"],
      "allocations": result["allocations"],
    }

  def ingest_event(
    self,
    event: Dict[str, Any],
    *,
    auto_reoptimize: bool = True,
  ) -> Dict[str, Any]:
    applied = self.apply_event(event)
    pending_before = len(self.pending_changes)
    should_reopt = self.should_reoptimize()

    response: Dict[str, Any] = {
      "event": applied["event"],
      "pending_change": applied["pending_change"],
      "pending_count_before": pending_before,
      "pending_count_after": pending_before,
      "should_reoptimize": should_reopt,
      "reoptimized": False,
    }

    if auto_reoptimize and should_reopt:
      response["reoptimized"] = True
      response["reopt_result"] = self.reoptimize(
        trigger=f"event:{applied['event']['id']}"
      )
      response["pending_count_after"] = len(self.pending_changes)

    return response

  def allocation_list(self) -> List[Dict[str, Any]]:
    return nested_to_list(self.current_allocation)

  def snapshot(self) -> Dict[str, Any]:
    active_teachers = sum(1 for t in self.teachers.values() if t.get("active", True))
    active_schools = sum(1 for s in self.schools.values() if s.get("active", True))

    return {
      "input_path": self.input_path,
      "counts": {
        "teachers_total": len(self.teachers),
        "teachers_active": active_teachers,
        "schools_total": len(self.schools),
        "schools_active": active_schools,
        "pending_changes": len(self.pending_changes),
        "events": len(self.events),
        "reoptimizations": len(self.history),
      },
      "blocked_routes": sorted([{"teacher": t, "school": s} for t, s in self.blocked_routes], key=lambda x: (x["teacher"], x["school"])),
      "kpi": compute_kpi(self.teachers, self.schools, self.allocation_list()),
      "pending_changes": copy.deepcopy(self.pending_changes),
    }
