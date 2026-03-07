#pragma once

#include <string>
#include <vector>

#include "mcmf.h"
#include "models.h"

struct DemandNode {
  int node_id = -1;
  int school_idx = -1;
  std::string subject;
  int demand = 0;
};

struct TeacherDemandArc {
  int teacher_idx = -1;  // -1 means dummy teacher arc
  int demand_idx = -1;
  int from_node = -1;
  int edge_index = -1;
};

struct FlowGraphBuild {
  MinCostMaxFlow mcmf;
  int source = 0;
  int sink = 0;
  int dummy_teacher_node = -1;
  int total_demand = 0;
  std::vector<DemandNode> demands;
  std::vector<TeacherDemandArc> real_teacher_arcs;
  std::vector<TeacherDemandArc> dummy_arcs;
  std::vector<std::vector<double>> distance_km;  // [teacher_idx][school_idx]
};

FlowGraphBuild BuildFlowGraph(const InputData& input, int alpha = 40,
                              int big_m = 10000, int distance_scale = 10,
                              double max_distance_km = 100.0);
