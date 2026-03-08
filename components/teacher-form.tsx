"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import type { FormValues } from "@/app/form/page";

export function TeacherForm() {
  const { register, formState: { errors } } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ name: "teachers" });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted">Teachers</h3>
        <button
          type="button"
          onClick={() => append({ id: "", name: "", capacity: 10, subjects: "", baseLat: "", baseLng: "" })}
          className="flex items-center gap-1 rounded-lg bg-accent-2 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus size={14} /> Teacher
        </button>
      </div>
      <div className="grid gap-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="rounded-xl border border-line bg-white/40 p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs text-muted">
                Teacher ID
                <input {...register(`teachers.${idx}.id`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Name
                <input {...register(`teachers.${idx}.name`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Capacity
                <input type="number" {...register(`teachers.${idx}.capacity`, { required: true, valueAsNumber: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Subjects (comma-separated)
                <input {...register(`teachers.${idx}.subjects`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Base Latitude
                <input type="number" step="any" {...register(`teachers.${idx}.baseLat`, { required: true })}
                  className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Base Longitude
                <input type="number" step="any" {...register(`teachers.${idx}.baseLng`, { required: true })}
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
          <p className="text-sm text-muted text-center py-4">No teachers added. Click &quot;+ Teacher&quot; to start.</p>
        )}
      </div>
    </div>
  );
}
