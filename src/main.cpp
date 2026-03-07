#include <algorithm>
#include <filesystem>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <utility>
#include <vector>

#include "graph_builder.h"
#include "greedy_baseline.h"
#include "io.h"
#include "kpi.h"

namespace {

std::vector<Allocation> DecodeMcmfAllocations(const InputData& input,
                                              const FlowGraphBuild& graph) {
  std::vector<Allocation> allocations;
  const auto& g = graph.mcmf.Graph();

  for (const TeacherDemandArc& arc : graph.real_teacher_arcs) {
    const auto& edge = g[arc.from_node][arc.edge_index];
    const int flow = edge.original_cap - edge.cap;
    if (flow <= 0) {
      continue;
    }

    const DemandNode& dn = graph.demands[arc.demand_idx];
    Allocation alloc;
    alloc.teacher = input.teachers[arc.teacher_idx].id;
    alloc.school = input.schools[dn.school_idx].id;
    alloc.subject = dn.subject;
    alloc.hours = flow;
    allocations.push_back(alloc);
  }

  std::sort(allocations.begin(), allocations.end(),
            [](const Allocation& a, const Allocation& b) {
              if (a.teacher != b.teacher) {
                return a.teacher < b.teacher;
              }
              if (a.school != b.school) {
                return a.school < b.school;
              }
              return a.subject < b.subject;
            });

  return allocations;
}

SolveResult BuildSolveResult(const InputData& input,
                             const std::vector<Allocation>& allocations) {
  SolveResult out;
  out.allocations = allocations;
  out.kpi = ComputeKPI(input, allocations);
  return out;
}

}  // namespace

int main(int argc, char** argv) {
  const std::string input_path = (argc >= 2) ? argv[1] : "data/synthetic_input.json";
  const std::string output_dir = (argc >= 3) ? argv[2] : "output";

  InputData input;
  std::string error;
  if (!LoadInputJson(input_path, &input, &error)) {
    std::cerr << "[error] " << error << '\n';
    return 1;
  }

  FlowGraphBuild graph = BuildFlowGraph(input);
  const auto [flow, min_cost] =
      graph.mcmf.Solve(graph.source, graph.sink, graph.total_demand);
  (void)flow;

  const std::vector<Allocation> mcmf_allocations = DecodeMcmfAllocations(input, graph);
  const SolveResult mcmf_result = BuildSolveResult(input, mcmf_allocations);

  const std::vector<Allocation> greedy_allocations = RunGreedyBaseline(input);
  const SolveResult greedy_result = BuildSolveResult(input, greedy_allocations);

  std::filesystem::create_directories(output_dir);

  if (!SaveSolveResultJson(output_dir + "/allocation_mcmf.json", mcmf_result,
                           &error) ||
      !SaveSolveResultJson(output_dir + "/allocation_greedy.json", greedy_result,
                           &error) ||
      !SaveSolveResultJson(output_dir + "/allocation.json", mcmf_result, &error)) {
    std::cerr << "[error] " << error << '\n';
    return 1;
  }

  std::cout << std::fixed << std::setprecision(2);
  std::cout << "Input: " << input_path << '\n';
  std::cout << "Total demand: " << graph.total_demand << " hours\n";
  std::cout << "MCMF flow sent: " << flow << " hours\n";
  std::cout << "MCMF min-cost (scaled): " << min_cost << '\n';

  std::cout << "\nMCMF KPI\n";
  std::cout << "  coverage_pct: " << mcmf_result.kpi.coverage_pct << "\n";
  std::cout << "  total_travel_km: " << mcmf_result.kpi.total_travel_km << "\n";
  std::cout << "  workload_std: " << mcmf_result.kpi.workload_std << "\n";

  std::cout << "\nGreedy KPI\n";
  std::cout << "  coverage_pct: " << greedy_result.kpi.coverage_pct << "\n";
  std::cout << "  total_travel_km: " << greedy_result.kpi.total_travel_km << "\n";
  std::cout << "  workload_std: " << greedy_result.kpi.workload_std << "\n";

  std::cout << "\nOutput written to: " << output_dir << '\n';
  return 0;
}
