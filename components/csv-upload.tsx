"use client";

import { useRef, useState, useCallback } from "react";
import { UploadSimple, FileText } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">CSV Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted leading-relaxed">
          CSV supports 3 row types: <code className="bg-mint/50 border border-emerald/10 rounded px-1 text-emerald text-[11px]">teacher</code>,{" "}
          <code className="bg-mint/50 border border-emerald/10 rounded px-1 text-emerald text-[11px]">school</code>,{" "}
          <code className="bg-mint/50 border border-emerald/10 rounded px-1 text-emerald text-[11px]">demand</code>.
        </p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-7 cursor-pointer transition-all ${
            dragging ? "border-emerald bg-mint/30" : "border-line/60 bg-white/30 hover:border-sage/40 hover:bg-mint/10"
          }`}
        >
          {fileName ? (
            <>
              <FileText size={22} weight="duotone" className="text-emerald" />
              <p className="text-sm font-medium text-ink">{fileName}</p>
            </>
          ) : (
            <>
              <UploadSimple size={22} weight="duotone" className="text-muted/50" />
              <p className="text-sm text-muted">Drop CSV here or click to browse</p>
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
