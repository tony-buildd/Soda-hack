"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import type { FormValues } from "@/app/form/page";

export function SchoolForm() {
  const { register } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ name: "schools" });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted">Schools</h3>
        <button
          type="button"
          onClick={() => append({ id: "", name: "", priority: 1, lat: "", lng: "", demand: "" })}
          className="flex items-center gap-1 rounded-lg bg-accent-2 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus size={14} /> School
        </button>
      </div>
      <div className="grid gap-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="rounded-xl border border-line bg-white/40 p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs text-muted">
                School ID
                <input {...register(`schools.${idx}.id`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Name
                <input {...register(`schools.${idx}.name`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Priority
                <input type="number" {...register(`schools.${idx}.priority`, { required: true, valueAsNumber: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Latitude
                <input type="number" step="any" {...register(`schools.${idx}.lat`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Longitude
                <input type="number" step="any" {...register(`schools.${idx}.lng`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Demand (Math:12, English:8)
                <input {...register(`schools.${idx}.demand`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
            </div>
            <div className="flex justify-end mt-2">
              <button type="button" onClick={() => remove(idx)}
                className="flex items-center gap-1 rounded-lg bg-[#fff5ef] border border-[#f2d1bf] px-2 py-1 text-xs text-[#9c3b00]">
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-muted text-center py-4">No schools added. Click &quot;+ School&quot; to start.</p>
        )}
      </div>
    </div>
  );
}
