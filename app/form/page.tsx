"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { GlassCard } from "@/components/glass-card";
import { PageTransition } from "@/components/page-transition";
import { TeacherForm } from "@/components/teacher-form";
import { SchoolForm } from "@/components/school-form";
import { CsvUpload } from "@/components/csv-upload";
import { runOptimizerJson, runOptimizerCsv } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { InputData } from "@/lib/types";

interface TeacherRow {
  id: string;
  name: string;
  capacity: number;
  subjects: string;
  baseLat: string;
  baseLng: string;
}

interface SchoolRow {
  id: string;
  name: string;
  priority: number;
  lat: string;
  lng: string;
  demand: string;
}

export interface FormValues {
  teachers: TeacherRow[];
  schools: SchoolRow[];
}

function parseDemand(raw: string): Record<string, number> {
  const demand: Record<string, number> = {};
  for (const segment of raw.split(",")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const [subject, hours] = trimmed.split(":");
    if (!subject?.trim() || !hours?.trim()) continue;
    demand[subject.trim()] = Number(hours.trim());
  }
  return demand;
}

function buildInput(data: FormValues): InputData {
  return {
    teachers: data.teachers.map((t) => ({
      id: t.id,
      name: t.name,
      capacity: t.capacity,
      subjects: t.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      base: [Number(t.baseLat), Number(t.baseLng)] as [number, number],
    })),
    schools: data.schools.map((s) => ({
      id: s.id,
      name: s.name,
      priority: s.priority,
      location: [Number(s.lat), Number(s.lng)] as [number, number],
      demand: parseDemand(s.demand),
    })),
  };
}

export default function FormPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      teachers: [{ id: "", name: "", capacity: 10, subjects: "", baseLat: "", baseLng: "" }],
      schools: [{ id: "", name: "", priority: 1, lat: "", lng: "", demand: "" }],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setStatus("Running optimizer...");
    try {
      const input = buildInput(data);
      await runOptimizerJson(input);
      router.push("/statistics");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (file: File) => {
    setLoading(true);
    setStatus("Uploading CSV and running optimizer...");
    try {
      await runOptimizerCsv(file);
      router.push("/statistics");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-screen-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Input Data</h1>
          <p className="text-muted mt-1">Configure teachers, schools, and run the allocation optimizer.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <GlassCard hover={false} className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold">Manual Input Form</h2>
                    <p className="text-sm text-muted mt-0.5">
                      Edit teachers and schools below. On submit, the system reruns the C++ allocator.
                    </p>
                  </div>
                </div>
                <div className="space-y-8">
                  <TeacherForm />
                  <div className="h-px bg-line" />
                  <SchoolForm />
                </div>
                <div className="flex items-center gap-4 mt-6 pt-5 border-t border-line">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-accent-2 px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-accent-2/20 disabled:bg-[#c5cfcb] disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Running..." : "Run From Form"}
                  </button>
                  {status && <span className="text-sm text-muted">{status}</span>}
                </div>
              </GlassCard>
            </form>
          </FormProvider>

          <div className="space-y-5">
            <CsvUpload onUpload={handleCsvUpload} disabled={loading} />

            <GlassCard hover={false} className="p-5">
              <label className="text-sm font-semibold text-ink block mb-2">Algorithm</label>
              <select className="w-full rounded-xl border border-line bg-white/60 px-4 py-2.5 text-sm transition-colors hover:bg-white/80">
                <option value="mcmf">Min-Cost Max-Flow</option>
                <option value="greedy">Greedy Baseline</option>
              </select>
              <p className="text-xs text-muted mt-2">MCMF finds globally optimal allocation. Greedy is faster but approximate.</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
