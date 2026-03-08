"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { PageTransition } from "@/components/page-transition";
import { TeacherForm } from "@/components/teacher-form";
import { SchoolForm } from "@/components/school-form";
import { CsvUpload } from "@/components/csv-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { runOptimizerJson, runOptimizerCsv } from "@/lib/api";
import {
  CircleNotch,
  Upload,
  PencilSimple,
  ChalkboardTeacher,
  Buildings,
  Clock,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react";
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
      subjects: t.subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
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
  const [mode, setMode] = useState<"csv" | "manual">("csv");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const methods = useForm<FormValues>({
    defaultValues: {
      teachers: [
        { id: "", name: "", capacity: 10, subjects: "", baseLat: "", baseLng: "" },
      ],
      schools: [{ id: "", name: "", priority: 1, lat: "", lng: "", demand: "" }],
    },
  });

  const onSubmitManual = async (data: FormValues) => {
    setLoading(true);
    setStatus("Building assignment plan...");
    try {
      const input = buildInput(data);
      await runOptimizerJson(input);
      router.push("/statistics");
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCsvRun = async () => {
    if (!csvFile) return;
    setLoading(true);
    setStatus("Uploading CSV and running optimizer...");
    try {
      await runOptimizerCsv(csvFile);
      router.push("/statistics");
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Data Input</h1>
          <p className="text-muted mt-1 text-[15px]">
            Upload teacher roster and school demand, then run the allocation
            optimizer.
          </p>
        </div>

        {/* Input mode toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "csv" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("csv")}
            className={
              mode === "csv"
                ? "rounded-full bg-emerald hover:bg-forest"
                : "rounded-full"
            }
          >
            <Upload size={14} weight="bold" /> CSV Upload
            <Badge variant="secondary" className="ml-1 rounded-full text-[10px] px-1.5">
              Recommended
            </Badge>
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
            className={
              mode === "manual"
                ? "rounded-full bg-emerald hover:bg-forest"
                : "rounded-full"
            }
          >
            <PencilSimple size={14} weight="bold" /> Manual Entry
          </Button>
        </div>

        {/* CSV mode */}
        {mode === "csv" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-5">
              <CsvUpload
                onUpload={(file) => {
                  setCsvFile(file);
                  setStatus("");
                }}
                disabled={loading}
              />

              {/* Sanity check after file selected */}
              {csvFile && (
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle
                        size={20}
                        weight="fill"
                        className="text-emerald"
                      />
                      <p className="text-sm font-medium text-ink">
                        File loaded: {csvFile.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted mb-4">
                      The optimizer will parse teachers, schools, and demand rows
                      from your CSV, then generate an assignment plan using
                      Min-Cost Max-Flow.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleCsvRun}
                        disabled={loading}
                        className="rounded-full bg-emerald hover:bg-forest shadow-md shadow-emerald/10"
                      >
                        {loading && (
                          <CircleNotch
                            size={16}
                            weight="bold"
                            className="animate-spin"
                          />
                        )}
                        {loading ? "Running..." : "Run Optimizer"}
                        {!loading && <ArrowRight size={14} />}
                      </Button>
                      {status && (
                        <span className="text-sm text-muted">{status}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
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
                    MCMF minimizes total travel distance while maximizing
                    subject coverage. Greedy is faster but approximate.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-ink">
                    What the CSV should contain
                  </h3>
                  <div className="space-y-2 text-xs text-muted">
                    <div className="flex items-start gap-2">
                      <ChalkboardTeacher size={14} weight="bold" className="text-emerald mt-0.5 shrink-0" />
                      <span>
                        <strong className="text-ink">teacher</strong> rows: id,
                        name, capacity, subjects, lat, lng
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Buildings size={14} weight="bold" className="text-emerald mt-0.5 shrink-0" />
                      <span>
                        <strong className="text-ink">school</strong> rows: id,
                        name, priority, lat, lng
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={14} weight="bold" className="text-emerald mt-0.5 shrink-0" />
                      <span>
                        <strong className="text-ink">demand</strong> rows:
                        school_id, subject, hours_per_week
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Manual mode */}
        {mode === "manual" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmitManual)}>
                <Card>
                  <CardHeader>
                    <CardTitle>Manual Input</CardTitle>
                    <CardDescription>
                      Add teachers and schools individually. Use CSV upload for
                      bulk data.
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
                        className="rounded-full px-7 bg-emerald hover:bg-forest shadow-md shadow-emerald/10"
                      >
                        {loading && (
                          <CircleNotch
                            size={16}
                            weight="bold"
                            className="animate-spin"
                          />
                        )}
                        {loading ? "Running..." : "Run Optimizer"}
                      </Button>
                      {status && (
                        <span className="text-sm text-muted">{status}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </form>
            </FormProvider>

            <div className="space-y-5">
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
