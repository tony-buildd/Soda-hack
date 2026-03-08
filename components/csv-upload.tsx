"use client";

import { useRef, useState, useCallback } from "react";
import { UploadSimple, FileText, Lightning } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_URLS } from "@/lib/constants";

const DEMO_DATASETS = [
  {
    label: "Lai Châu",
    file: "/laichau_combined.csv",
    teachers: 70,
    schools: 40,
    badge: "70T · 40S",
  },
  {
    label: "Hà Giang",
    file: "/hagiang_combined.csv",
    teachers: 0,
    schools: 0,
    badge: "full dataset",
  },
] as const;

interface CsvUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export function CsvUpload({ onUpload, disabled }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const loadDemo = useCallback(async (filePath: string, label: string) => {
    const res = await fetch(filePath);
    const text = await res.text();
    const blob = new Blob([text], { type: "text/csv" });
    const file = new File([blob], `${label.toLowerCase().replace(" ", "_")}_combined.csv`, { type: "text/csv" });
    setFileName(file.name);
    onUpload(file);
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
                onClick={() => loadDemo(d.file, d.label)}
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
          {fileName ? (
            <>
              <FileText size={22} weight="duotone" className="text-emerald" />
              <p className="text-sm font-medium text-ink">{fileName}</p>
              <p className="text-xs text-muted">Click to replace</p>
            </>
          ) : (
            <>
              <UploadSimple size={22} weight="duotone" className="text-muted/50" />
              <p className="text-sm text-muted">Drop CSV here or click to browse</p>
              <p className="text-xs text-muted/60">Accepts teachers, schools, or combined formats</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={disabled}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        <a href={API_URLS.csvTemplate} className="text-xs font-semibold text-emerald no-underline hover:underline">
          Download CSV template
        </a>
      </CardContent>
    </Card>
  );
}
