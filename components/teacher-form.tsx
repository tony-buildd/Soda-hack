"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormValues } from "@/app/form/page";

export function TeacherForm() {
  const { register } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ name: "teachers" });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted">Teachers</h3>
        <Button
          type="button"
          size="sm"
          onClick={() => append({ id: "", name: "", capacity: 10, subjects: "", baseLat: "", baseLng: "" })}
          className="rounded-full h-8 text-xs bg-emerald hover:bg-forest"
        >
          <Plus size={14} weight="bold" /> Teacher
        </Button>
      </div>
      <div className="grid gap-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="rounded-xl border border-line/60 bg-white/50 p-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <label className="grid gap-1 text-xs text-muted font-medium">
                Teacher ID
                <Input {...register(`teachers.${idx}.id`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Name
                <Input {...register(`teachers.${idx}.name`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Capacity
                <Input type="number" {...register(`teachers.${idx}.capacity`, { required: true, valueAsNumber: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Subjects (comma-separated)
                <Input {...register(`teachers.${idx}.subjects`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Base Latitude
                <Input type="number" step="any" {...register(`teachers.${idx}.baseLat`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Base Longitude
                <Input type="number" step="any" {...register(`teachers.${idx}.baseLng`, { required: true })} className="h-9 text-sm" />
              </label>
            </div>
            <div className="flex justify-end mt-2.5">
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash size={14} weight="bold" /> Remove
              </Button>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-muted text-center py-6">No teachers added yet.</p>
        )}
      </div>
    </div>
  );
}
