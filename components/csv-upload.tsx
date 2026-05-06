"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { UploadSimple, FileText, Lightning, X } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_URLS } from "@/lib/constants";

const DEMO_DATASETS = [
  {
    label: "Hà Giang",
    files: ["/teachers_hagiang.csv", "/schools_hagiang.csv"],
    badge: "Teacher + School",
  },
] as const;

export type CsvEntityType = "teacher" | "school" | "combined" | "unknown";

export interface CsvFileStatus {
  name: string;
  entityType: CsvEntityType;
}

export interface CsvSelectionStatus {
  files: CsvFileStatus[];
  hasTeacher: boolean;
  hasSchool: boolean;
  hasCombined: boolean;
  isReady: boolean;
  message: string;
}

function classifyCsvHeader(headerLine: string): CsvEntityType {
  const headers = headerLine
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);

  if (headers.includes("entity")) return "combined";
  if (headers.includes("teacher_id")) return "teacher";
  if (headers.includes("school_id")) return "school";
  return "unknown";
}

interface CsvUploadProps {
  files: File[];
  onUpload: (files: File[]) => void;
  onRemove: (fileName: string) => void;
  onClear: () => void;
  onStatusChange: (status: CsvSelectionStatus) => void;
  disabled?: boolean;
}

export function CsvUpload({
  files,
  onUpload,
  onRemove,
  onClear,
  onStatusChange,
  disabled,
}: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<CsvFileStatus[]>([]);

  const handleFiles = useCallback((selectedFiles: FileList | File[] | null | undefined) => {
    if (!selectedFiles) return;
    const nextFiles = Array.from(selectedFiles).filter((file) =>
      file.name.toLowerCase().endsWith(".csv")
    );
    if (nextFiles.length === 0) return;
    const mergedFiles = new Map(files.map((file) => [file.name, file]));
    for (const file of nextFiles) {
      mergedFiles.set(file.name, file);
    }
    onUpload(Array.from(mergedFiles.values()));
  }, [files, onUpload]);

  useEffect(() => {
    let cancelled = false;

    const inspectFiles = async () => {
      if (files.length === 0) {
        const emptyStatus: CsvSelectionStatus = {
          files: [],
          hasTeacher: false,
          hasSchool: false,
          hasCombined: false,
          isReady: false,
          message: "Upload a combined CSV or both a teacher file and a school file.",
        };
        setFileStatuses([]);
        onStatusChange(emptyStatus);
        return;
      }

      const statuses = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          const [headerLine = ""] = text.split(/\r?\n/, 1);
          return {
            name: file.name,
            entityType: classifyCsvHeader(headerLine),
          } satisfies CsvFileStatus;
        })
      );

      if (cancelled) return;

      const hasTeacher = statuses.some((file) => file.entityType === "teacher");
      const hasSchool = statuses.some((file) => file.entityType === "school");
      const hasCombined = statuses.some((file) => file.entityType === "combined");
      const hasUnknown = statuses.some((file) => file.entityType === "unknown");

      let message = "Ready to run.";
      let isReady = false;

      if (hasUnknown) {
        message = "One or more files could not be identified. Use a teacher, school, or combined CSV format.";
      } else if (hasCombined) {
        isReady = true;
        message = "Ready to run with a combined CSV.";
      } else if (hasTeacher && hasSchool) {
        isReady = true;
        message = "Ready to run with teacher and school files.";
      } else if (hasTeacher) {
        message = "Missing school file.";
      } else if (hasSchool) {
        message = "Missing teacher file.";
      }

      setFileStatuses(statuses);
      onStatusChange({
        files: statuses,
        hasTeacher,
        hasSchool,
        hasCombined,
        isReady,
        message,
      });
    };

    void inspectFiles();

    return () => {
      cancelled = true;
    };
  }, [files, onStatusChange]);

  const badgeLabel: Record<CsvEntityType, string> = {
    teacher: "Teacher",
    school: "School",
    combined: "Combined",
    unknown: "Unknown",
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const loadDemo = useCallback(async (filePaths: readonly string[]) => {
    const loadedFiles = await Promise.all(
      filePaths.map(async (filePath) => {
        const res = await fetch(filePath);
        const text = await res.text();
        const blob = new Blob([text], { type: "text/csv" });
        const fileName = filePath.split("/").pop() ?? "demo.csv";
        return new File([blob], fileName, { type: "text/csv" });
      })
    );
    onUpload(loadedFiles);
  }, [onUpload]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">CSV Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick load demo datasets */}
        <div>
          <p className="text-xs font-medium text-muted mb-2 flex items-center gap-1.5">
            <Lightning size={12} weight="fill" className="text-gold" />
            Load demo dataset
          </p>
          <div className="flex gap-2 flex-wrap">
            {DEMO_DATASETS.map((d) => (
              <Button
                key={d.label}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => loadDemo(d.files)}
                className="h-8 text-xs rounded-full"
              >
                {d.label}
                <Badge variant="secondary" className="ml-1 rounded-full text-[10px] px-1.5">
                  {d.badge}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-muted">
          <div className="flex-1 h-px bg-line/40" />
          <span>or upload your own</span>
          <div className="flex-1 h-px bg-line/40" />
        </div>

        {/* Drag-and-drop area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
            dragging ? "border-emerald bg-mint/30" : "border-line/60 bg-white/30 hover:border-sage/40 hover:bg-mint/10"
          }`}
        >
          {files.length > 0 ? (
            <>
              <FileText size={22} weight="duotone" className="text-emerald" />
              <p className="text-sm font-medium text-ink">
                {files.length === 1 ? files[0].name : `${files.length} CSV files selected`}
              </p>
              <p className="text-xs text-muted truncate max-w-full text-center">
                {files.map((file) => file.name).join(", ")}
              </p>
            </>
          ) : (
            <>
              <UploadSimple size={22} weight="duotone" className="text-muted/50" />
              <p className="text-sm text-muted">Drop one or more CSV files here or click to browse</p>
              <p className="text-xs text-muted/60">Accepts a combined CSV or separate teacher and school CSV files</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,text/csv"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </div>
        {files.length > 0 && (
          <div className="space-y-2 rounded-lg border border-line/50 bg-mint/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-ink">Selected files</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={onClear}
                className="h-7 rounded-full px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
            <div className="space-y-2">
              {fileStatuses.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between gap-3 rounded-md bg-white/80 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-ink">{file.name}</span>
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {badgeLabel[file.entityType]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      onClick={() => onRemove(file.name)}
                      className="h-7 w-7 rounded-full"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <a href={API_URLS.csvTemplate} className="text-xs font-semibold text-emerald no-underline hover:underline">
          Download combined CSV template
        </a>
      </CardContent>
    </Card>
  );
}
