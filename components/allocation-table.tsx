"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Allocation } from "@/lib/types";

interface AllocationTableProps {
  allocations: Allocation[];
}

export function AllocationTable({ allocations }: AllocationTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[440px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-8">
                    No allocations
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{a.teacher}</TableCell>
                    <TableCell>{a.school}</TableCell>
                    <TableCell>{a.subject}</TableCell>
                    <TableCell className="text-right font-medium">{a.hours}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
