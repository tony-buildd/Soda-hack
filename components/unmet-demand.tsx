"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarningCircle, CheckCircle } from "@phosphor-icons/react";
import type { UnmetDemandItem } from "@/lib/types";

interface UnmetDemandProps {
  items: UnmetDemandItem[];
}

export function UnmetDemand({ items }: UnmetDemandProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Unmet Demand
          <Badge variant={items.length === 0 ? "secondary" : "destructive"} className="rounded-full text-[10px]">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald py-4">
            <CheckCircle size={18} weight="fill" />
            All demand has been met.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <WarningCircle size={16} weight="fill" className="text-destructive mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">{item.school}</span>
                  {" "}&mdash; {item.subject}: missing{" "}
                  <span className="font-semibold">{item.missing_hours}h</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
