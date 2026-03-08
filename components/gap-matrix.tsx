"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InputData, Allocation } from "@/lib/types";

interface GapMatrixProps {
  input: InputData;
  allocations: Allocation[];
}

export function GapMatrix({ input, allocations }: GapMatrixProps) {
  const { subjects, matrix, schoolNames } = useMemo(() => {
    // Collect all subjects
    const subjectSet = new Set<string>();
    for (const s of input.schools) {
      for (const subj of Object.keys(s.demand)) {
        subjectSet.add(subj);
      }
    }
    const subjects = Array.from(subjectSet).sort();

    // Build allocated hours lookup: school -> subject -> hours
    const allocated: Record<string, Record<string, number>> = {};
    for (const a of allocations) {
      if (!allocated[a.school]) allocated[a.school] = {};
      allocated[a.school][a.subject] = (allocated[a.school][a.subject] || 0) + a.hours;
    }

    // Build matrix rows
    const matrix = input.schools.map((school) => {
      const cells = subjects.map((subj) => {
        const demanded = school.demand[subj] || 0;
        if (demanded === 0) return { demanded: 0, assigned: 0, gap: 0, status: "none" as const };
        const assigned = allocated[school.id]?.[subj] || 0;
        const gap = demanded - assigned;
        const status = gap <= 0 ? "covered" as const : assigned > 0 ? "partial" as const : "unmet" as const;
        return { demanded, assigned, gap: Math.max(0, gap), status };
      });
      return { schoolId: school.id, schoolName: school.name, priority: school.priority, cells };
    });

    // Sort by worst coverage first
    matrix.sort((a, b) => {
      const aUnmet = a.cells.filter((c) => c.status === "unmet").length;
      const bUnmet = b.cells.filter((c) => c.status === "unmet").length;
      return bUnmet - aUnmet;
    });

    return { subjects, matrix, schoolNames: matrix.map((m) => m.schoolName) };
  }, [input, allocations]);

  const totalUnmet = matrix.reduce((sum, row) => sum + row.cells.filter((c) => c.status === "unmet").length, 0);
  const totalPartial = matrix.reduce((sum, row) => sum + row.cells.filter((c) => c.status === "partial").length, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Coverage Gap Matrix</CardTitle>
            <CardDescription className="mt-1">
              Schools &times; Subjects — color shows coverage status. Sorted by severity.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {totalUnmet > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {totalUnmet} unmet
              </Badge>
            )}
            {totalPartial > 0 && (
              <Badge variant="secondary" className="rounded-full bg-amber/15 text-amber border-amber/20">
                {totalPartial} partial
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 border-b border-line font-semibold text-muted sticky left-0 bg-card z-10 min-w-[160px]">
                  School
                </th>
                <th className="text-center px-2 py-2 border-b border-line font-semibold text-muted w-12">
                  Priority
                </th>
                {subjects.map((s) => (
                  <th key={s} className="text-center px-2 py-2 border-b border-line font-semibold text-muted min-w-[80px]">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.schoolId} className="hover:bg-white/30 dark:hover:bg-white/5">
                  <td className="px-3 py-2 border-b border-line/50 font-medium text-ink sticky left-0 bg-card z-10">
                    {row.schoolName}
                  </td>
                  <td className="text-center px-2 py-2 border-b border-line/50 text-muted">
                    {row.priority}
                  </td>
                  {row.cells.map((cell, i) => (
                    <td
                      key={i}
                      className={`text-center px-2 py-2 border-b border-line/50 font-medium ${
                        cell.status === "none"
                          ? "text-muted/30"
                          : cell.status === "covered"
                          ? "text-emerald bg-emerald/8"
                          : cell.status === "partial"
                          ? "text-amber bg-amber/8"
                          : "text-destructive bg-destructive/8"
                      }`}
                    >
                      {cell.status === "none" ? (
                        "—"
                      ) : cell.status === "covered" ? (
                        <span>{cell.assigned}/{cell.demanded}</span>
                      ) : (
                        <span>{cell.assigned}/{cell.demanded}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald/20 border border-emerald/30" />
            Fully covered
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber/20 border border-amber/30" />
            Partially covered
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/30" />
            No coverage
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
