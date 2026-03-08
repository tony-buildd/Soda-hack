import type { ResultBundle, RunSnapshotSummary } from "./types";
import { API_URLS } from "./constants";

export async function loadJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json();
}

export async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export async function postForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export async function fetchCurrentResults(): Promise<ResultBundle> {
  return loadJson<ResultBundle>(API_URLS.current);
}

export async function fetchRunHistory(): Promise<RunSnapshotSummary[]> {
  const res = await fetch(API_URLS.history);
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`Failed to load ${API_URLS.history}: ${res.status}`);
  }
  const data = (await res.json()) as { runs: RunSnapshotSummary[] };
  return data.runs;
}

export async function fetchHistoryRun(runId: string): Promise<ResultBundle> {
  return loadJson<ResultBundle>(`${API_URLS.history}/${runId}`);
}

export async function runOptimizerJson(input: unknown): Promise<ResultBundle> {
  return postJson<ResultBundle>(API_URLS.runJson, { input });
}

export async function runOptimizerCsv(files: File[]): Promise<ResultBundle> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  if (files[0]) {
    formData.append("file", files[0]);
  }
  return postForm<ResultBundle>(API_URLS.runCsv, formData);
}
