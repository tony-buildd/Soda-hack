#include "greedy_baseline.h"

#include <algorithm>
#include <numeric>
#include <tuple>

struct GreedyDemandItem {
  int school_idx = -1;
  std::string subject;
  int demand = 0;
  int priority = 1;
};

std::vector<Allocation> RunGreedyBaseline(const InputData& input) {
  std::vector<GreedyDemandItem> demand_items;
  for (int s = 0; s < static_cast<int>(input.schools.size()); ++s) {
    const School& school = input.schools[s];
    for (const auto& [subject, hours] : school.demand) {
      if (hours <= 0) {
        continue;
      }
      demand_items.push_back({s, subject, hours, school.priority});
    }
  }

  // High-priority schools first, then bigger demands.
  std::sort(demand_items.begin(), demand_items.end(),
            [](const GreedyDemandItem& a, const GreedyDemandItem& b) {
              if (a.priority != b.priority) {
                return a.priority > b.priority;
              }
              return a.demand > b.demand;
            });

  std::vector<int> remaining_capacity(input.teachers.size(), 0);
  for (int t = 0; t < static_cast<int>(input.teachers.size()); ++t) {
    remaining_capacity[t] = input.teachers[t].capacity;
  }

  std::vector<Allocation> allocations;

  for (const GreedyDemandItem& item : demand_items) {
    int remaining_demand = item.demand;

    std::vector<std::tuple<double, int>> candidates;
    for (int t = 0; t < static_cast<int>(input.teachers.size()); ++t) {
      if (remaining_capacity[t] <= 0 ||
          !TeacherCanTeach(input.teachers[t], item.subject)) {
        continue;
      }

      const double dist =
          HaversineKm(input.teachers[t].base, input.schools[item.school_idx].location);
      candidates.emplace_back(dist, t);
    }

    std::sort(candidates.begin(), candidates.end(),
              [](const auto& a, const auto& b) { return a < b; });

    for (const auto& [_, teacher_idx] : candidates) {
      if (remaining_demand <= 0) {
        break;
      }
      const int assign_hours = std::min(remaining_demand, remaining_capacity[teacher_idx]);
      if (assign_hours <= 0) {
        continue;
      }

      Allocation alloc;
      alloc.teacher = input.teachers[teacher_idx].id;
      alloc.school = input.schools[item.school_idx].id;
      alloc.subject = item.subject;
      alloc.hours = assign_hours;
      allocations.push_back(alloc);

      remaining_capacity[teacher_idx] -= assign_hours;
      remaining_demand -= assign_hours;
    }
  }

  return allocations;
}
