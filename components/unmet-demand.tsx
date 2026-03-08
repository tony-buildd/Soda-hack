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
  const schoolCount = Object.keys(bySchool).length;
  
  // Create a lookup map for schools if available
  const schoolMap = schools ? schools.reduce((acc, s) => ({ ...acc, [s.name]: s }), {} as Record<string, School>) : {};
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
          <h3 className="text-sm font-semibold text-muted">Hiring Priorities (By Subject)</h3>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {sortedSubjects.map(([subject, hours]) => (
              <div key={subject} className="relative overflow-hidden bg-white/50 dark:bg-zinc-900/50 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm group hover:border-red-200 dark:hover:border-red-900/50 transition-colors">
                {/* Background decorative blob */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
                
                <div className="relative flex justify-between items-end mb-3">
                   <div>
                     <span className="block font-medium text-sm text-zinc-500 dark:text-zinc-400 mb-0.5">Subject Gap</span>
                     <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{subject}</span>
                   </div>
                   <div className="text-right">
                     <span className="block text-2xl font-bold text-red-600 dark:text-red-400 tracking-tight">
                       {hours}<span className="text-base font-normal text-red-400/80 ml-0.5">h</span>
                     </span>
                     <span className="text-xs font-medium text-red-600/60 dark:text-red-400/60">needed</span>
                   </div>
                </div>
                
                <div className="relative h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="absolute h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-1000 ease-out" 
                     style={{ width: `${Math.min((hours / totalMissing) * 100 * 2.5, 100)}%` }}
                   />
                </div>
              </div>
            ))}
         </div>

         <div className="flex items-center justify-between mb-4 pt-2">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Impact by School</h3>
          <Badge variant="outline" className="rounded-full text-[10px] h-6 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-3">
            {schoolCount} schools affected
          </Badge>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-auto pr-2 custom-scrollbar">
          {Object.entries(bySchool).map(([school, unmetItems]) => (
            <div
              key={school}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-colors"
            >
              <div className="flex flex-col gap-1.5 min-w-0 flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{school}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unmetItems.map((item, i) => {
                    const schoolData = schoolMap[item.school];
                    const demand = schoolData?.demand[item.subject] || 0;
                    const percentMissing = demand > 0 ? Math.round((item.missing_hours / demand) * 100) : 0;
                    
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100/50 dark:border-red-900/30"
                        title={demand > 0 ? `${item.missing_hours}h missing out of ${demand}h required (${percentMissing}%)` : undefined}
                      >
                        {item.subject}
                        <span className="text-red-400 dark:text-red-500 font-normal">
                          -{item.missing_hours}h
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div className="shrink-0 text-right">
                <Badge variant="outline" className="rounded-md border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-mono text-[11px]">
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
