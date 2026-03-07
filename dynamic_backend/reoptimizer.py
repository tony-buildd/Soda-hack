from __future__ import annotations

import math
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple

try:
  from .min_cost_flow import MinCostMaxFlow
except ImportError:
  from min_cost_flow import MinCostMaxFlow

AllocationNested = Dict[str, Dict[str, Dict[str, int]]]


def haversine_km(a: Sequence[float], b: Sequence[float]) -> float:
  earth_radius_km = 6371.0
  lat1 = math.radians(float(a[0]))
  lon1 = math.radians(float(a[1]))
  lat2 = math.radians(float(b[0]))
  lon2 = math.radians(float(b[1]))
  dlat = lat2 - lat1
  dlon = lon2 - lon1
  h = (
    math.sin(dlat / 2) ** 2
    + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
  )
  return earth_radius_km * (2 * math.atan2(math.sqrt(h), math.sqrt(1.0 - h)))


def list_to_nested(allocations: Iterable[Dict[str, Any]]) -> AllocationNested:
  nested: AllocationNested = {}
  for alloc in allocations:
    teacher = str(alloc["teacher"])
    school = str(alloc["school"])
    subject = str(alloc["subject"])
    hours = int(alloc["hours"])
    if hours <= 0:
      continue
    nested.setdefault(teacher, {}).setdefault(school, {})[subject] = (
      nested.get(teacher, {}).get(school, {}).get(subject, 0) + hours
    )
  return nested


def nested_to_list(nested: AllocationNested) -> List[Dict[str, Any]]:
  out: List[Dict[str, Any]] = []
  for teacher, schools in nested.items():
    for school, subjects in schools.items():
      for subject, hours in subjects.items():
        if int(hours) <= 0:
          continue
        out.append(
          {
            "teacher": teacher,
            "school": school,
            "subject": subject,
            "hours": int(hours),
          }
        )
  out.sort(key=lambda x: (x["teacher"], x["school"], x["subject"]))
  return out


def flatten_nested_allocation(nested: AllocationNested) -> Dict[Tuple[str, str, str], int]:
  flat: Dict[Tuple[str, str, str], int] = {}
  for teacher, schools in nested.items():
    for school, subjects in schools.items():
      for subject, hours in subjects.items():
        if int(hours) > 0:
          flat[(teacher, school, subject)] = int(hours)
  return flat


def compute_allocation_diff(
  old_allocation: AllocationNested,
  new_allocation: AllocationNested,
) -> Dict[str, Any]:
  old_flat = flatten_nested_allocation(old_allocation)
  new_flat = flatten_nested_allocation(new_allocation)
  keys = sorted(set(old_flat.keys()) | set(new_flat.keys()))

  changed: List[Dict[str, Any]] = []
  switch_count = 0
  hour_delta_total = 0

  for key in keys:
    old_hours = old_flat.get(key, 0)
    new_hours = new_flat.get(key, 0)
    if old_hours == new_hours:
      continue

    teacher, school, subject = key
    changed.append(
      {
        "teacher": teacher,
        "school": school,
        "subject": subject,
        "old_hours": old_hours,
        "new_hours": new_hours,
        "delta_hours": new_hours - old_hours,
      }
    )

    if (old_hours > 0) != (new_hours > 0):
      switch_count += 1
    hour_delta_total += abs(new_hours - old_hours)

  return {
    "num_changed_assignments": len(changed),
    "num_switches": switch_count,
    "total_hour_delta": hour_delta_total,
    "changes": changed,
  }


def compute_kpi(
  teachers: Dict[str, Dict[str, Any]],
  schools: Dict[str, Dict[str, Any]],
  allocations: List[Dict[str, Any]],
) -> Dict[str, Any]:
  active_teachers = {
    tid: t for tid, t in teachers.items() if bool(t.get("active", True))
  }
  active_schools = {
    sid: s for sid, s in schools.items() if bool(s.get("active", True))
  }

  total_demand = 0
  for school in active_schools.values():
    for _, hours in school.get("demand", {}).items():
      total_demand += max(0, int(hours))

  assigned_by_slot: Dict[Tuple[str, str], int] = {}
  teacher_workload: Dict[str, int] = {tid: 0 for tid in active_teachers.keys()}
  teacher_schools: Dict[str, Set[str]] = {tid: set() for tid in active_teachers.keys()}

  for alloc in allocations:
    teacher = str(alloc.get("teacher", ""))
    school = str(alloc.get("school", ""))
    subject = str(alloc.get("subject", ""))
    hours = int(alloc.get("hours", 0))
    if hours <= 0:
      continue
    if teacher not in active_teachers or school not in active_schools:
      continue

    teacher_workload[teacher] += hours
    teacher_schools[teacher].add(school)
    assigned_by_slot[(school, subject)] = assigned_by_slot.get((school, subject), 0) + hours

  unmet: List[Dict[str, Any]] = []
  total_missing = 0
  for sid, school in active_schools.items():
    for subject, demand in school.get("demand", {}).items():
      demand_hours = max(0, int(demand))
      assigned = assigned_by_slot.get((sid, str(subject)), 0)
      missing = max(0, demand_hours - assigned)
      if missing > 0:
        unmet.append(
          {
            "school": sid,
            "subject": str(subject),
            "missing_hours": missing,
          }
        )
        total_missing += missing

  covered = max(0, total_demand - total_missing)
  coverage_pct = 100.0 if total_demand == 0 else (100.0 * covered / total_demand)

  total_travel = 0.0
  for tid, schools_for_teacher in teacher_schools.items():
    base = active_teachers[tid]["base"]
    for sid in schools_for_teacher:
      total_travel += haversine_km(base, active_schools[sid]["location"])

  workloads = [float(x) for x in teacher_workload.values()]
  workload_std = 0.0
  if workloads:
    mean = sum(workloads) / len(workloads)
    variance = sum((w - mean) ** 2 for w in workloads) / len(workloads)
    workload_std = math.sqrt(variance)

  unmet.sort(key=lambda x: (x["school"], x["subject"]))

  return {
    "coverage_pct": round(coverage_pct, 2),
    "total_travel_km": round(total_travel, 2),
    "workload_std": round(workload_std, 2),
    "unmet_demand": unmet,
  }


def run_reoptimizer(
  teachers: Dict[str, Dict[str, Any]],
  schools: Dict[str, Dict[str, Any]],
  old_allocation: AllocationNested,
  blocked_routes: Optional[Set[Tuple[str, str]]] = None,
  *,
  alpha: int = 40,
  big_m: int = 10000,
  distance_scale: int = 10,
  delta_km: Optional[float] = None,
  urgency: str = "medium",
) -> Dict[str, Any]:
  blocked_routes = blocked_routes or set()

  teacher_ids = [
    tid
    for tid, teacher in teachers.items()
    if bool(teacher.get("active", True)) and int(teacher.get("capacity", 0)) > 0
  ]
  school_ids = [sid for sid, school in schools.items() if bool(school.get("active", True))]

  demand_items: List[Dict[str, Any]] = []
  total_demand = 0
  for sid in school_ids:
    school = schools[sid]
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
          "location": school["location"],
        }
      )
      total_demand += demand_hours

  if total_demand == 0:
    empty_nested: AllocationNested = {}
    return {
      "allocation": empty_nested,
      "allocations": [],
      "kpi": compute_kpi(teachers, schools, []),
      "solver": {
        "total_demand": 0,
        "flow": 0,
        "min_cost": 0,
        "delta_km": 0.0,
        "delta_cost": 0,
        "urgency": urgency,
        "urgency_factor": 1.0,
        "average_feasible_dist_km": 0.0,
      },
    }

  source = 0
  teacher_start = 1
  teacher_node_by_id = {tid: teacher_start + i for i, tid in enumerate(teacher_ids)}
  dummy_node = teacher_start + len(teacher_ids)
  demand_start = dummy_node + 1
  sink = demand_start + len(demand_items)

  mcmf = MinCostMaxFlow(sink + 1)

  for tid in teacher_ids:
    cap = max(0, int(teachers[tid].get("capacity", 0)))
    mcmf.add_edge(source, teacher_node_by_id[tid], cap, 0)
  mcmf.add_edge(source, dummy_node, total_demand, 0)

  for i, demand in enumerate(demand_items):
    node_id = demand_start + i
    mcmf.add_edge(node_id, sink, int(demand["demand"]), 0)

  feasible_distances: List[float] = []
  for tid in teacher_ids:
    teacher = teachers[tid]
    subject_set = set(str(s) for s in teacher.get("subjects", []))
    for demand in demand_items:
      sid = str(demand["school_id"])
      subject = str(demand["subject"])
      if subject not in subject_set:
        continue
      if (tid, sid) in blocked_routes:
        continue
      feasible_distances.append(haversine_km(teacher["base"], demand["location"]))

  avg_feasible_dist = (
    sum(feasible_distances) / len(feasible_distances) if feasible_distances else 0.0
  )
  if delta_km is None:
    delta_km = 0.5 * avg_feasible_dist

  urgency_factor_map = {
    "high": 0.4,
    "medium": 1.0,
    "low": 1.6,
  }
  urgency_factor = urgency_factor_map.get(urgency, 1.0)
  delta_cost = int(round(float(delta_km) * urgency_factor * distance_scale))

  arc_refs: List[Dict[str, Any]] = []
  for i, demand in enumerate(demand_items):
    demand_node = demand_start + i
    sid = str(demand["school_id"])
    subject = str(demand["subject"])
    demand_hours = int(demand["demand"])
    priority = int(demand["priority"])

    for tid in teacher_ids:
      teacher = teachers[tid]
      subject_set = set(str(s) for s in teacher.get("subjects", []))
      if subject not in subject_set:
        continue
      if (tid, sid) in blocked_routes:
        continue

      dist = haversine_km(teacher["base"], demand["location"])
      base_cost = int(round(dist * distance_scale)) - alpha * priority

      old_hours = int(old_allocation.get(tid, {}).get(sid, {}).get(subject, 0))
      switching_penalty = 0 if old_hours > 0 else delta_cost
      final_cost = base_cost + switching_penalty

      from_node = teacher_node_by_id[tid]
      edge_idx = mcmf.add_edge(from_node, demand_node, demand_hours, final_cost)
      arc_refs.append(
        {
          "teacher_id": tid,
          "school_id": sid,
          "subject": subject,
          "from_node": from_node,
          "edge_idx": edge_idx,
        }
      )

    mcmf.add_edge(dummy_node, demand_node, demand_hours, big_m * distance_scale)

  flow, min_cost = mcmf.min_cost_flow(source, sink, total_demand)

  allocations: List[Dict[str, Any]] = []
  for ref in arc_refs:
    edge = mcmf.graph[ref["from_node"]][ref["edge_idx"]]
    used = edge.original_cap - edge.cap
    if used <= 0:
      continue
    allocations.append(
      {
        "teacher": ref["teacher_id"],
        "school": ref["school_id"],
        "subject": ref["subject"],
        "hours": int(used),
      }
    )

  allocations.sort(key=lambda x: (x["teacher"], x["school"], x["subject"]))
  new_allocation = list_to_nested(allocations)
  kpi = compute_kpi(teachers, schools, allocations)

  missing_total = sum(int(x["missing_hours"]) for x in kpi["unmet_demand"])
  real_flow = total_demand - missing_total

  return {
    "allocation": new_allocation,
    "allocations": allocations,
    "kpi": kpi,
    "solver": {
      "total_demand": total_demand,
      "flow": flow,
      "real_assigned_hours": real_flow,
      "dummy_hours": max(0, flow - real_flow),
      "min_cost": int(min_cost),
      "delta_km": round(float(delta_km), 3),
      "delta_cost": int(delta_cost),
      "urgency": urgency,
      "urgency_factor": urgency_factor,
      "average_feasible_dist_km": round(avg_feasible_dist, 3),
    },
  }
