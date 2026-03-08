"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarningCircle, CheckCircle, MapPin } from "@phosphor-icons/react";
import type { UnmetDemandItem } from "@/lib/types";

interface UnmetDemandProps {
  items: UnmetDemandItem[];
}

export function UnmetDemand({ items }: UnmetDemandProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-emerald">
          <CheckCircle size={22} weight="fill" />
          <div>
            <p className="font-semibold text-sm">All demand met</p>
            <p className="text-xs text-muted mt-0.5">
              Every school has full subject coverage in this allocation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by school
  const bySchool: Record<string, UnmetDemandItem[]> = {};
  for (const item of items) {
    if (!bySchool[item.school]) bySchool[item.school] = [];
    bySchool[item.school].push(item);
  }
  const totalHours = items.reduce((s, i) => s + i.missing_hours, 0);
  const schoolCount = Object.keys(bySchool).length;

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <WarningCircle size={22} weight="fill" />
            </div>
            <div>
              <CardTitle>Unmet Demand</CardTitle>
              <CardDescription className="mt-0.5">
                Schools the optimizer could not fully cover
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="destructive" className="rounded-full">
              {schoolCount} {schoolCount === 1 ? "school" : "schools"}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {totalHours}h missing
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(bySchool).map(([school, unmetItems]) => (
            <div
              key={school}
              className="rounded-xl border border-destructive/15 bg-destructive/5 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} weight="fill" className="text-destructive" />
                <span className="text-sm font-semibold text-ink">{school}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {unmetItems.map((item, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="rounded-full text-xs border-destructive/20 text-destructive"
                  >
                    {item.subject}: {item.missing_hours}h missing
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          These gaps typically occur when no qualified teacher exists within feasible travel
          distance, or all available teachers have exhausted their capacity. Consider hiring
          for these specific subject-school combinations.
        </p>
      </CardContent>
    </Card>
  );
}
