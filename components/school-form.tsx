"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormValues } from "@/app/form/page";

export function SchoolForm() {
  const { register } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ name: "schools" });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted">Schools</h3>
        <Button
          type="button"
          size="sm"
          onClick={() => append({ id: "", name: "", priority: 1, lat: "", lng: "", demand: "" })}
          className="rounded-full h-8 text-xs bg-emerald hover:bg-forest"
        >
          <Plus size={14} weight="bold" /> School
        </Button>
      </div>
      <div className="grid gap-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="rounded-xl border border-line/60 bg-white/50 p-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <label className="grid gap-1 text-xs text-muted font-medium">
                School ID
                <Input {...register(`schools.${idx}.id`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Name
                <Input {...register(`schools.${idx}.name`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Priority
                <Input type="number" {...register(`schools.${idx}.priority`, { required: true, valueAsNumber: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Latitude
                <Input type="number" step="any" {...register(`schools.${idx}.lat`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Longitude
                <Input type="number" step="any" {...register(`schools.${idx}.lng`, { required: true })} className="h-9 text-sm" />
              </label>
              <label className="grid gap-1 text-xs text-muted font-medium">
                Demand (Math:12, English:8)
                <Input {...register(`schools.${idx}.demand`, { required: true })} className="h-9 text-sm" />
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
          <p className="text-sm text-muted text-center py-6">No schools added yet.</p>
        )}
      </div>
    </div>
  );
}
