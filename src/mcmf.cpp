#include "mcmf.h"

#include <algorithm>
#include <limits>
#include <queue>

MinCostMaxFlow::MinCostMaxFlow(int n) { Reset(n); }

void MinCostMaxFlow::Reset(int n) {
  n_ = n;
  graph_.assign(n_, {});
}

int MinCostMaxFlow::AddEdge(int from, int to, int cap, int cost) {
  Edge fwd;
  fwd.to = to;
  fwd.rev = static_cast<int>(graph_[to].size());
  fwd.cap = cap;
  fwd.cost = cost;
  fwd.original_cap = cap;

  Edge rev;
  rev.to = from;
  rev.rev = static_cast<int>(graph_[from].size());
  rev.cap = 0;
  rev.cost = -cost;
  rev.original_cap = 0;

  graph_[from].push_back(fwd);
  graph_[to].push_back(rev);

  return static_cast<int>(graph_[from].size()) - 1;
}

std::pair<int, long long> MinCostMaxFlow::Solve(int source, int sink,
                                                int max_flow) {
  int total_flow = 0;
  long long total_cost = 0;

  const int kInf = std::numeric_limits<int>::max() / 4;
  std::vector<int> dist(n_), prev_node(n_), prev_edge(n_), in_queue(n_);

  while (total_flow < max_flow) {
    std::fill(dist.begin(), dist.end(), kInf);
    std::fill(in_queue.begin(), in_queue.end(), 0);

    std::queue<int> q;
    dist[source] = 0;
    q.push(source);
    in_queue[source] = 1;

    while (!q.empty()) {
      const int u = q.front();
      q.pop();
      in_queue[u] = 0;

      for (int i = 0; i < static_cast<int>(graph_[u].size()); ++i) {
        const Edge& e = graph_[u][i];
        if (e.cap <= 0) {
          continue;
        }
        if (dist[u] + e.cost < dist[e.to]) {
          dist[e.to] = dist[u] + e.cost;
          prev_node[e.to] = u;
          prev_edge[e.to] = i;
          if (!in_queue[e.to]) {
            in_queue[e.to] = 1;
            q.push(e.to);
          }
        }
      }
    }

    if (dist[sink] == kInf) {
      break;
    }

    int add_flow = max_flow - total_flow;
    for (int v = sink; v != source; v = prev_node[v]) {
      const Edge& e = graph_[prev_node[v]][prev_edge[v]];
      add_flow = std::min(add_flow, e.cap);
    }

    for (int v = sink; v != source; v = prev_node[v]) {
      Edge& e = graph_[prev_node[v]][prev_edge[v]];
      Edge& r = graph_[v][e.rev];
      e.cap -= add_flow;
      r.cap += add_flow;
    }

    total_flow += add_flow;
    total_cost += 1LL * add_flow * dist[sink];
  }

  return {total_flow, total_cost};
}
