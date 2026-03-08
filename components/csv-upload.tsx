"use client";

import { useRef, useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { GlassCard } from "./glass-card";
import { API_URLS } from "@/lib/constants";

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

  return (
    <GlassCard hover={false} className="p-5">
      <h2 className="text-base font-bold mb-2">CSV Upload Input</h2>
      <p className="text-sm text-muted mb-3">
        CSV supports 3 row types: <code className="bg-[#edf5f0] border border-line rounded-md px-1">teacher</code>,{" "}
        <code className="bg-[#edf5f0] border border-line rounded-md px-1">school</code>,{" "}
        <code className="bg-[#edf5f0] border border-line rounded-md px-1">demand</code>.
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
          dragging ? "border-accent-2 bg-accent-2/5" : "border-line bg-white/30"
        }`}
      >
        <Upload size={24} className="text-muted" />
        <p className="text-sm text-muted">{fileName ?? "Drop CSV here or click to browse"}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <div className="mt-3">
        <a href={API_URLS.csvTemplate} className="text-sm font-semibold text-accent no-underline hover:underline">
          Download CSV template
        </a>
      </div>
    </GlassCard>
  );
}
