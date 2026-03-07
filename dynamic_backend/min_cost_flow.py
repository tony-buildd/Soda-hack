from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class Edge:
  to: int
  rev: int
  cap: int
  cost: int
  original_cap: int


class MinCostMaxFlow:
  def __init__(self, n: int) -> None:
    self.n = n
    self.graph: List[List[Edge]] = [[] for _ in range(n)]

  def add_edge(self, u: int, v: int, cap: int, cost: int) -> int:
    fwd = Edge(to=v, rev=len(self.graph[v]), cap=cap, cost=cost, original_cap=cap)
    rev = Edge(to=u, rev=len(self.graph[u]), cap=0, cost=-cost, original_cap=0)
    self.graph[u].append(fwd)
    self.graph[v].append(rev)
    return len(self.graph[u]) - 1

  def min_cost_flow(self, source: int, sink: int, max_flow: int) -> Tuple[int, int]:
    total_flow = 0
    total_cost = 0
    inf = 10**18

    while total_flow < max_flow:
      dist = [inf] * self.n
      in_queue = [False] * self.n
      prev_node = [-1] * self.n
      prev_edge = [-1] * self.n

      dist[source] = 0
      q = deque([source])
      in_queue[source] = True

      while q:
        u = q.popleft()
        in_queue[u] = False
        for i, e in enumerate(self.graph[u]):
          if e.cap <= 0:
            continue
          cand = dist[u] + e.cost
          if cand < dist[e.to]:
            dist[e.to] = cand
            prev_node[e.to] = u
            prev_edge[e.to] = i
            if not in_queue[e.to]:
              in_queue[e.to] = True
              q.append(e.to)

      if dist[sink] >= inf:
        break

      add_flow = max_flow - total_flow
      v = sink
      while v != source:
        u = prev_node[v]
        ei = prev_edge[v]
        if u < 0 or ei < 0:
          add_flow = 0
          break
        add_flow = min(add_flow, self.graph[u][ei].cap)
        v = u

      if add_flow <= 0:
        break

      v = sink
      while v != source:
        u = prev_node[v]
        ei = prev_edge[v]
        edge = self.graph[u][ei]
        edge.cap -= add_flow
        self.graph[v][edge.rev].cap += add_flow
        v = u

      total_flow += add_flow
      total_cost += add_flow * dist[sink]

    return total_flow, total_cost
