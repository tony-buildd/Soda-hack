export interface Teacher {
  id: string;
  name: string;
  capacity: number;
  subjects: string[];
  base: [number, number];
}

export interface School {
  id: string;
  name: string;
  priority: number;
  location: [number, number];
  demand: Record<string, number>;
}

export interface InputData {
  teachers: Teacher[];
  schools: School[];
}

export interface Allocation {
  teacher: string;
  school: string;
  subject: string;
  hours: number;
}

export interface UnmetDemandItem {
  school: string;
  subject: string;
  missing_hours: number;
}

export interface KPI {
  coverage_pct: number;
  total_travel_km: number;
  workload_std: number;
  unmet_demand: UnmetDemandItem[];
}

export interface AlgorithmResult {
  allocations: Allocation[];
  kpi: KPI;
}

export interface ResultBundle {
  input: InputData;
  mcmf: AlgorithmResult;
  greedy: AlgorithmResult;
}
