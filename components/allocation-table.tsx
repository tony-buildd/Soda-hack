"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChalkboardTeacher, Buildings, MagnifyingGlass } from "@phosphor-icons/react";
import type { Allocation } from "@/lib/types";

interface AllocationTableProps {
  allocations: Allocation[];
}

type ViewMode = "by-teacher" | "by-school";

export function AllocationTable({ allocations }: AllocationTableProps) {
  const [view, setView] = useState<ViewMode>("by-teacher");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allocations;
    const q = search.toLowerCase();
    return allocations.filter(
      (a) =>
        a.teacher.toLowerCase().includes(q) ||
        a.school.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q)
    );
  }, [allocations, search]);

  // Group data based on view mode
  const grouped = useMemo(() => {
    const key = view === "by-teacher" ? "teacher" : "school";
    const groups: Record<string, Allocation[]> = {};
    for (const a of filtered) {
      const k = a[key];
      if (!groups[k]) groups[k] = [];
      groups[k].push(a);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, view]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CardTitle>Assignments</CardTitle>
            <Badge variant="secondary" className="rounded-full text-xs">
              {allocations.length} total
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "by-teacher" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("by-teacher")}
              className={view === "by-teacher" ? "rounded-full h-8 text-xs bg-emerald hover:bg-forest" : "rounded-full h-8 text-xs"}
            >
              <ChalkboardTeacher size={14} weight="bold" /> By Teacher
            </Button>
            <Button
              variant={view === "by-school" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("by-school")}
              className={view === "by-school" ? "rounded-full h-8 text-xs bg-emerald hover:bg-forest" : "rounded-full h-8 text-xs"}
            >
              <Buildings size={14} weight="bold" /> By School
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search teacher, school, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background text-foreground"
          />
        </div>

        <div className="overflow-auto max-h-[800px]">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No assignments found.</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([groupKey, items]) => (
                <div key={groupKey}>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card py-1 z-10">
                    {view === "by-teacher" ? (
                      <ChalkboardTeacher size={14} weight="fill" className="text-emerald" />
                    ) : (
                      <Buildings size={14} weight="fill" className="text-emerald" />
                    )}
                    <span className="text-sm font-semibold text-ink">{groupKey}</span>
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {items.reduce((s, a) => s + a.hours, 0)}h
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{view === "by-teacher" ? "School" : "Teacher"}</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((a, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {view === "by-teacher" ? a.school : a.teacher}
                          </TableCell>
                          <TableCell>{a.subject}</TableCell>
                          <TableCell className="text-right font-medium">{a.hours}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
