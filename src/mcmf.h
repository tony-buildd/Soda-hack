#pragma once

#include <climits>
#include <utility>
#include <vector>

class MinCostMaxFlow {
 public:
  struct Edge {
    int to = 0;
    int rev = 0;
    int cap = 0;
    int cost = 0;
    int original_cap = 0;
  };

  explicit MinCostMaxFlow(int n = 0);

  void Reset(int n);

  // Returns edge index in graph[from] for the forward edge.
  int AddEdge(int from, int to, int cap, int cost);

  // Returns {max_flow, min_cost}.
  std::pair<int, long long> Solve(int source, int sink,
                                  int max_flow = INT_MAX);

  const std::vector<std::vector<Edge>>& Graph() const { return graph_; }

 private:
  int n_ = 0;
  std::vector<std::vector<Edge>> graph_;
};
