"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarningCircle, CheckCircle, MapPin } from "@phosphor-icons/react";
import type { UnmetDemandItem, School } from "@/lib/types";

interface UnmetDemandProps {
  items: UnmetDemandItem[];
  totalDemand?: number;
  schools?: School[];
}

export function UnmetDemand({ items, totalDemand, schools }: UnmetDemandProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-emerald-600">
          <CheckCircle size={22} weight="fill" />
          <div>
            <p className="font-semibold text-sm">All demand met</p>
            <p className="text-xs text-muted-foreground mt-0.5">
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
  
  // Group by subject (for summary)
  const bySubject: Record<string, number> = {};
  for (const item of items) {
    if (!bySubject[item.subject]) bySubject[item.subject] = 0;
    bySubject[item.subject] += item.missing_hours;
  }
  
  const sortedSubjects = Object.entries(bySubject)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 subjects

  const totalMissing = items.reduce((s, i) => s + i.missing_hours, 0);
  
  // Create a lookup map for schools if available
  const schoolMap = schools ? schools.reduce((acc, s) => ({ ...acc, [s.name]: s }), {} as Record<string, School>) : {};
  const schoolCount = Object.keys(bySchool).length;
  
  // Calculate percentages if totalDemand is provided
  const percentageMissing = totalDemand ? Math.round((totalMissing / totalDemand) * 100) : 0;
  const percentageMet = 100 - percentageMissing;

  return (
    <Card className="overflow-hidden">
      <div className="bg-rose-50/50 dark:bg-rose-950/10 border-b border-rose-100 dark:border-rose-900/20 p-4">
        <div className="flex items-center gap-3 mb-4">
           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
             <WarningCircle size={22} weight="fill" />
           </div>
           <div>
             <CardTitle className="text-base text-rose-900 dark:text-rose-100">Systemic Shortage Detected</CardTitle>
             <CardDescription className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
               Even with optimal allocation, {percentageMissing}% of demand cannot be met due to lack of teachers.
             </CardDescription>
           </div>
        </div>
        
        {totalDemand && (
          <div className="space-y-1.5 mb-1">
            <div className="h-2.5 w-full bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${percentageMet}%` }}
              />
              <div 
                className="h-full bg-rose-400" 
                style={{ width: `${percentageMissing}%` }} 
              />
            </div>
            <div className="flex justify-between text-xs font-medium px-0.5">
              <span className="text-emerald-700 dark:text-emerald-400">Met Demand: {totalDemand - totalMissing}h ({percentageMet}%)</span>
              <span className="text-rose-600 dark:text-rose-400">Unmet: {totalMissing}h ({percentageMissing}%)</span>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Hiring Priorities (By Subject)</h3>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {sortedSubjects.map(([subject, hours]) => (
              <Card key={subject} className="p-4 flex flex-col justify-between shadow-sm border-rose-100 dark:border-rose-900/20">
                <div className="flex justify-between items-start mb-2">
                   <div>
                     <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Gap</span>
                     <h3 className="font-bold text-lg">{subject}</h3>
                   </div>
                   <div className="text-right">
                     <span className="text-2xl font-bold text-rose-500 dark:text-rose-400 block leading-none">{hours}</span>
                     <span className="text-xs text-muted-foreground">hours needed</span>
                   </div>
                </div>
                
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
                   <div 
                     className="bg-rose-400 dark:bg-rose-500 h-full rounded-full" 
                     style={{ width: `${Math.min((hours / totalMissing) * 100 * 2.5, 100)}%` }}
                   />
                </div>
              </Card>
            ))}
         </div>

         <div className="flex items-center justify-between mb-4 pt-2">
          <h3 className="text-sm font-semibold">Impact by School</h3>
          <Badge variant="secondary" className="rounded-full text-[10px] h-6 px-3">
            {schoolCount} schools affected
          </Badge>
        </div>

        <div className="space-y-2 max-h-[360px] overflow-auto pr-2">
          {Object.entries(bySchool).map(([school, unmetItems]) => (
            <div
              key={school}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col gap-1.5 min-w-0 flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} weight="fill" className="text-muted-foreground" />
                  <span className="text-sm font-semibold truncate">{school}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unmetItems.map((item, i) => {
                    const schoolData = schoolMap[item.school];
                    const demand = schoolData?.demand[item.subject] || 0;
                    const percentMissing = demand > 0 ? Math.round((item.missing_hours / demand) * 100) : 0;
                    
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30"
                        title={demand > 0 ? `${item.missing_hours}h missing out of ${demand}h required (${percentMissing}%)` : undefined}
                      >
                        {item.subject}
                        <span className="font-normal opacity-80">
                          -{item.missing_hours}h
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div className="shrink-0 text-right">
                <Badge variant="outline" className="rounded-md border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                  -{unmetItems.reduce((s, i) => s + i.missing_hours, 0)}h
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
