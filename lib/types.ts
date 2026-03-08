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

export interface RunSnapshotSummary {
  id: string;
  created_at: string;
  trigger: string;
  teacher_count: number;
  school_count: number;
  allocation_count: number;
  coverage_pct: number;
  total_travel_km: number;
  workload_std: number;
}

export interface DecisionSummarySchoolImpact {
  school_id: string;
  school_name: string;
  unmet_delta_hours: number;
  current_unmet_hours: number;
}

export interface DecisionSummary {
  available: boolean;
  category: string;
  headline: string;
  body: string;
  coverage_delta_pct: number;
  unmet_hours_delta: number;
  travel_delta_km: number;
  worsened_school_count: number;
  school_section_title: string;
  school_section_empty_text: string;
  worsened_schools: DecisionSummarySchoolImpact[];
}

export interface ResultBundleMeta {
  run_snapshot?: RunSnapshotSummary;
  decision_summary?: DecisionSummary;
  [key: string]: unknown;
}

export interface ResultBundle {
  input: InputData;
  mcmf: AlgorithmResult;
  greedy: AlgorithmResult;
  meta?: ResultBundleMeta;
}
