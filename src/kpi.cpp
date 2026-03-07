#include "kpi.h"

#include <cmath>
#include <map>
#include <set>
#include <utility>

KPIResult ComputeKPI(const InputData& input,
                     const std::vector<Allocation>& allocations) {
  KPIResult out;

  std::map<std::string, int> teacher_workload;
  std::map<std::string, LatLng> teacher_base;
  std::map<std::string, LatLng> school_loc;
  std::map<std::pair<std::string, std::string>, int> assigned_hours;
  std::map<std::string, std::set<std::string>> teacher_school_pairs;

  int total_demand = 0;
  for (const Teacher& t : input.teachers) {
    teacher_workload[t.id] = 0;
    teacher_base[t.id] = t.base;
  }

  for (const School& s : input.schools) {
    school_loc[s.id] = s.location;
    for (const auto& [subject, hours] : s.demand) {
      if (hours > 0) {
        total_demand += hours;
      }
      (void)subject;
    }
  }

  for (const Allocation& alloc : allocations) {
    if (alloc.hours <= 0) {
      continue;
    }
    if (!teacher_workload.count(alloc.teacher)) {
      continue;
    }
    teacher_workload[alloc.teacher] += alloc.hours;
    assigned_hours[{alloc.school, alloc.subject}] += alloc.hours;
    teacher_school_pairs[alloc.teacher].insert(alloc.school);
  }

  int total_missing = 0;
  for (const School& s : input.schools) {
    for (const auto& [subject, demand] : s.demand) {
      const int assigned = assigned_hours[{s.id, subject}];
      const int missing = std::max(0, demand - assigned);
      if (missing > 0) {
        out.unmet_demand.push_back({s.id, subject, missing});
        total_missing += missing;
      }
    }
  }

  const int covered = std::max(0, total_demand - total_missing);
  out.coverage_pct = (total_demand == 0)
                         ? 100.0
                         : (100.0 * static_cast<double>(covered) /
                            static_cast<double>(total_demand));

  double total_travel = 0.0;
  for (const auto& [teacher_id, schools] : teacher_school_pairs) {
    for (const std::string& school_id : schools) {
      total_travel += HaversineKm(teacher_base[teacher_id], school_loc[school_id]);
    }
  }
  out.total_travel_km = total_travel;

  std::vector<double> workloads;
  workloads.reserve(teacher_workload.size());
  for (const auto& [_, workload] : teacher_workload) {
    workloads.push_back(static_cast<double>(workload));
  }

  if (!workloads.empty()) {
    double sum = 0.0;
    for (double w : workloads) {
      sum += w;
    }
    const double mean = sum / static_cast<double>(workloads.size());

    double variance = 0.0;
    for (double w : workloads) {
      const double diff = w - mean;
      variance += diff * diff;
    }
    variance /= static_cast<double>(workloads.size());
    out.workload_std = std::sqrt(variance);
  }

  return out;
}
