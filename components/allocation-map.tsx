"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import { GlassCard } from "./glass-card";
import { COLORS } from "@/lib/constants";
import type { InputData, Allocation } from "@/lib/types";
import "leaflet/dist/leaflet.css";

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30] });
    }
  }, [map, positions]);
  return null;
}

interface AllocationMapProps {
  input: InputData;
  allocations: Allocation[];
}

export function AllocationMap({ input, allocations }: AllocationMapProps) {
  const teachersById = useMemo(() => {
    const m: Record<string, (typeof input.teachers)[0]> = {};
    for (const t of input.teachers) m[t.id] = t;
    return m;
  }, [input.teachers]);

  const schoolsById = useMemo(() => {
    const m: Record<string, (typeof input.schools)[0]> = {};
    for (const s of input.schools) m[s.id] = s;
    return m;
  }, [input.schools]);

  const allPositions: [number, number][] = [
    ...input.teachers.map((t) => t.base),
    ...input.schools.map((s) => s.location),
  ];

  const center: [number, number] = allPositions.length > 0
    ? [
        allPositions.reduce((s, p) => s + p[0], 0) / allPositions.length,
        allPositions.reduce((s, p) => s + p[1], 0) / allPositions.length,
      ]
    : [21.02, 105.84];

  return (
    <GlassCard hover={false} className="overflow-hidden p-6">
      <h2 className="text-lg font-bold mb-3">Allocation Map</h2>
      <div className="h-[560px] rounded-xl overflow-hidden border border-line">
        <MapContainer center={center} zoom={8} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FitBounds positions={allPositions} />

          {input.teachers.map((t) => (
            <CircleMarker key={t.id} center={t.base} radius={6}
              pathOptions={{ color: COLORS.teacher, fillColor: COLORS.teacher, fillOpacity: 0.85 }}>
              <Popup><b>{t.name}</b><br />{t.id}<br />Capacity: {t.capacity}</Popup>
            </CircleMarker>
          ))}

          {input.schools.map((s) => (
            <CircleMarker key={s.id} center={s.location} radius={8}
              pathOptions={{ color: COLORS.school, fillColor: COLORS.school, fillOpacity: 0.9 }}>
              <Popup><b>{s.name}</b><br />{s.id}<br />Priority: {s.priority}</Popup>
            </CircleMarker>
          ))}

          {allocations.filter(a => a.hours > 0).map((alloc, i) => {
            const teacher = teachersById[alloc.teacher];
            const school = schoolsById[alloc.school];
            if (!teacher || !school) return null;
            return (
              <Polyline key={i} positions={[teacher.base, school.location]}
                pathOptions={{ color: COLORS.accent2, weight: 1 + Math.min(alloc.hours, 12) / 3, opacity: 0.75 }}>
                <Tooltip>{alloc.teacher} &rarr; {alloc.school} ({alloc.subject}: {alloc.hours}h)</Tooltip>
              </Polyline>
            );
          })}
        </MapContainer>
      </div>
    </GlassCard>
  );
}
