"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarningCircle, CheckCircle, MapPin } from "@phosphor-icons/react";
import type { UnmetDemandItem } from "@/lib/types";

interface UnmetDemandProps {
  items: UnmetDemandItem[];
}

export function UnmetDemand({ items, totalDemand }: { items: UnmetDemandItem[], totalDemand?: number }) {
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
  const totalMissing = items.reduce((s, i) => s + i.missing_hours, 0);
  const schoolCount = Object.keys(bySchool).length;
  
  // Calculate percentages if totalDemand is provided
  const percentageMissing = totalDemand ? Math.round((totalMissing / totalDemand) * 100) : 0;
  const percentageMet = 100 - percentageMissing;

  return (
    <Card className="border-destructive/20 overflow-hidden">
      <div className="bg-destructive/5 border-b border-destructive/10 p-4">
        <div className="flex items-center gap-3 mb-3">
           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
             <WarningCircle size={22} weight="fill" />
           </div>
           <div>
             <CardTitle className="text-base text-destructive">Systemic Shortage Detected</CardTitle>
             <CardDescription className="text-xs text-destructive/80 mt-0.5">
               Even with optimal allocation, {percentageMissing}% of demand cannot be met due to lack of teachers.
             </CardDescription>
           </div>
        </div>
        
        {totalDemand && (
          <div className="space-y-2 mb-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-emerald-700">Met Demand: {totalDemand - totalMissing}h ({percentageMet}%)</span>
              <span className="text-destructive">Unmet: {totalMissing}h ({percentageMissing}%)</span>
            </div>
            <div className="h-2.5 w-full bg-destructive/20 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${percentageMet}%` }}
              />
              <div 
                className="h-full bg-destructive" 
                style={{ width: `${percentageMissing}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">Specific Gaps by School</h3>
          <div className="flex gap-2">
            <Badge variant="secondary" className="rounded-full text-[10px] h-5">
              {schoolCount} schools affected
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-auto pr-1">
          {Object.entries(bySchool).map(([school, unmetItems]) => (
            <div
              key={school}
              className="rounded-lg border border-line p-3 bg-card hover:bg-muted/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} weight="fill" className="text-muted" />
                  <span className="text-sm font-semibold text-ink">{school}</span>
                </div>
                <Badge variant="outline" className="rounded-full text-[11px] h-6 border-destructive/20 text-destructive bg-destructive/5 px-2.5">
                  Total: -{unmetItems.reduce((s, i) => s + i.missing_hours, 0)}h
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unmetItems.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/30"
                  >
                    {item.subject}
                    <span className="opacity-70 text-[10px] font-normal">
                      -{item.missing_hours}h
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
