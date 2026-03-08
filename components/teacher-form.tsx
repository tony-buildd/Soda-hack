"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash, Plus, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { FormValues } from "@/app/form/page";

export function TeacherForm() {
  const { register, watch } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ name: "teachers" });
  const [search, setSearch] = useState("");

  const teachers = watch("teachers");

  // Filter indices based on search matching id, name, or subjects
  const filteredIndices = fields.map((_, idx) => idx).filter((idx) => {
    if (!search.trim()) return true;
    const t = teachers[idx];
    if (!t) return true;
    const q = search.toLowerCase();
    return (
      t.id?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.subjects?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted">
          Teachers
          <Badge variant="secondary" className="ml-2 rounded-full text-[10px] px-2">
            {fields.length}
          </Badge>
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => append({ id: "", name: "", capacity: 10, subjects: "", baseLat: "", baseLng: "" })}
          className="rounded-full h-8 text-xs bg-emerald hover:bg-forest"
        >
          <Plus size={14} weight="bold" /> Teacher
        </Button>
      </div>

      {/* Search bar — always visible */}
      {fields.length > 0 && (
        <div className="relative mb-3">
          <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            placeholder="Search by name, ID, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-8 text-sm bg-background text-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {filteredIndices.map((idx) => {
          const field = fields[idx];
          return (
            <div key={field.id} className="rounded-xl border border-line bg-card p-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <label className="grid gap-1 text-xs text-muted font-medium">
                  Teacher ID
                  <Input {...register(`teachers.${idx}.id`, { required: true })} className="h-9 text-sm bg-background text-foreground" />
                </label>
                <label className="grid gap-1 text-xs text-muted font-medium">
                  Name
                  <Input {...register(`teachers.${idx}.name`, { required: true })} className="h-9 text-sm bg-background text-foreground" />
                </label>
                <label className="grid gap-1 text-xs text-muted font-medium">
                  Capacity
                  <Input type="number" {...register(`teachers.${idx}.capacity`, { required: true, valueAsNumber: true })} className="h-9 text-sm bg-background text-foreground" />
                </label>
                <label className="grid gap-1 text-xs text-muted font-medium">
                  Subjects (comma-separated)
                  <Input {...register(`teachers.${idx}.subjects`, { required: true })} className="h-9 text-sm bg-background text-foreground" />
                </label>
                <label className="grid gap-1 text-xs text-muted font-medium">
                  Base Latitude
                  <Input type="number" step="any" {...register(`teachers.${idx}.baseLat`, { required: true })} className="h-9 text-sm bg-background text-foreground" />
                </label>
                <label className="grid gap-1 text-xs text-muted font-medium">
                  Base Longitude
                  <Input type="number" step="any" {...register(`teachers.${idx}.baseLng`, { required: true })} className="h-9 text-sm bg-background text-foreground" />
                </label>
              </div>
              <div className="flex justify-end mt-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash size={14} weight="bold" /> Remove
                </Button>
              </div>
            </div>
          );
        })}
        {fields.length > 0 && filteredIndices.length === 0 && (
          <p className="text-sm text-muted text-center py-6">No teachers match &ldquo;{search}&rdquo;</p>
        )}
        {fields.length === 0 && (
          <p className="text-sm text-muted text-center py-6">No teachers added yet.</p>
        )}
      </div>
    </div>
  );
}
