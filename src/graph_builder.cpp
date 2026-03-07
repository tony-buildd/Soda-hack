#include "graph_builder.h"

#include <cmath>

FlowGraphBuild BuildFlowGraph(const InputData& input, int alpha, int big_m,
                              int distance_scale, double max_distance_km) {
  FlowGraphBuild out;

  const int teacher_count = static_cast<int>(input.teachers.size());
  const int school_count = static_cast<int>(input.schools.size());

  out.distance_km.assign(teacher_count, std::vector<double>(school_count, 0.0));
  for (int t = 0; t < teacher_count; ++t) {
    for (int s = 0; s < school_count; ++s) {
      out.distance_km[t][s] =
          HaversineKm(input.teachers[t].base, input.schools[s].location);
    }
  }

  for (int s = 0; s < school_count; ++s) {
    for (const auto& [subject, hours] : input.schools[s].demand) {
      if (hours <= 0) {
        continue;
      }
      DemandNode dn;
      dn.school_idx = s;
      dn.subject = subject;
      dn.demand = hours;
      out.demands.push_back(dn);
      out.total_demand += hours;
    }
  }

  out.source = 0;
  const int teacher_start = 1;
  out.dummy_teacher_node = teacher_start + teacher_count;
  const int demand_start = out.dummy_teacher_node + 1;

  for (int i = 0; i < static_cast<int>(out.demands.size()); ++i) {
    out.demands[i].node_id = demand_start + i;
  }

  out.sink = demand_start + static_cast<int>(out.demands.size());

  out.mcmf.Reset(out.sink + 1);

  for (int t = 0; t < teacher_count; ++t) {
    out.mcmf.AddEdge(out.source, teacher_start + t, input.teachers[t].capacity, 0);
  }
  out.mcmf.AddEdge(out.source, out.dummy_teacher_node, out.total_demand, 0);

  for (const DemandNode& dn : out.demands) {
    out.mcmf.AddEdge(dn.node_id, out.sink, dn.demand, 0);
  }

  for (int t = 0; t < teacher_count; ++t) {
    const int teacher_node = teacher_start + t;
    for (int d = 0; d < static_cast<int>(out.demands.size()); ++d) {
      const DemandNode& dn = out.demands[d];
      if (!TeacherCanTeach(input.teachers[t], dn.subject)) {
        continue;
      }

      const School& school = input.schools[dn.school_idx];
      const double dist = out.distance_km[t][dn.school_idx];
      if (max_distance_km > 0.0 && dist > max_distance_km) {
        continue;
      }
      const int dist_cost = static_cast<int>(std::round(dist * distance_scale));
      const int cost = dist_cost - alpha * school.priority;

      TeacherDemandArc ref;
      ref.teacher_idx = t;
      ref.demand_idx = d;
      ref.from_node = teacher_node;
      ref.edge_index = out.mcmf.AddEdge(teacher_node, dn.node_id, dn.demand, cost);
      out.real_teacher_arcs.push_back(ref);
    }
  }

  for (int d = 0; d < static_cast<int>(out.demands.size()); ++d) {
    const DemandNode& dn = out.demands[d];
    TeacherDemandArc ref;
    ref.teacher_idx = -1;
    ref.demand_idx = d;
    ref.from_node = out.dummy_teacher_node;
    ref.edge_index = out.mcmf.AddEdge(out.dummy_teacher_node, dn.node_id, dn.demand,
                                      big_m * distance_scale);
    out.dummy_arcs.push_back(ref);
  }

  return out;
}
