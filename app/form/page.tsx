"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { PageTransition } from "@/components/page-transition";
import { TeacherForm } from "@/components/teacher-form";
import { SchoolForm } from "@/components/school-form";
import { CsvUpload } from "@/components/csv-upload";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runOptimizerJson, runOptimizerCsv } from "@/lib/api";
import { CircleNotch } from "@phosphor-icons/react";
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
          <p className="text-muted mt-1 text-[15px]">Configure teachers, schools, and run the allocation optimizer.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Manual Input Form</CardTitle>
                  <CardDescription>
                    Edit teachers and schools below. On submit, the system reruns the C++ allocator.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <TeacherForm />
                  <div className="h-px bg-line/50" />
                  <SchoolForm />
                  <div className="flex items-center gap-4 pt-4 border-t border-line/50">
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="rounded-full px-7 bg-emerald hover:bg-forest shadow-md shadow-emerald/10"
                    >
                      {loading && <CircleNotch size={16} weight="bold" className="animate-spin" />}
                      {loading ? "Running..." : "Run From Form"}
                    </Button>
                    {status && <span className="text-sm text-muted">{status}</span>}
                  </div>
                </CardContent>
              </Card>
            </form>
          </FormProvider>

          <div className="space-y-5">
            <CsvUpload onUpload={handleCsvUpload} disabled={loading} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Algorithm</CardTitle>
              </CardHeader>
              <CardContent>
                <Select defaultValue="mcmf">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcmf">Min-Cost Max-Flow</SelectItem>
                    <SelectItem value="greedy">Greedy Baseline</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted mt-2.5 leading-relaxed">
                  MCMF finds the globally optimal allocation. Greedy is faster but approximate.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
