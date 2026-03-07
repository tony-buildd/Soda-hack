"use client";

import { useState, useTransition } from "react";
import {
  applyMetricDelta,
  defaultScenarioId,
  getScenarioById,
  scenarios,
  type GapRow,
  type MetricSnapshot,
  type Priority,
  type SchoolCoverage,
  type TeacherAssignment,
  type UnmetNeed,
} from "./demo-data";

type AssignmentView = "teacher" | "school";

type MetricKey = keyof MetricSnapshot;

const metricLabels: Record<MetricKey, string> = {
  coverage: "Coverage",
  unmetHours: "Unmet hours",
  travelKm: "Travel",
  schoolsServed: "Schools served",
};

const priorityClasses: Record<Priority, string> = {
  critical: "border-[#d37b57]/70 bg-[#4e251d]/70 text-[#fce4d7]",
  watch: "border-[#d7b058]/70 bg-[#554521]/70 text-[#f5ebc5]",
  stable: "border-[#7a997e]/70 bg-[#1f3b31]/70 text-[#d5ead8]",
};

function formatMetricValue(key: MetricKey, value: number) {
  if (key === "coverage") {
    return `${value}%`;
  }

  if (key === "travelKm") {
    return `${value} km`;
  }

  return `${value}`;
}

function describeDelta(key: MetricKey, baseline: number, current: number) {
  const diff = Math.round((current - baseline) * 10) / 10;

  if (diff === 0) {
    return "No change from manual baseline";
  }

  if (key === "coverage") {
    return `${Math.abs(diff)} pts ${diff > 0 ? "better" : "worse"} than manual`;
  }

  if (key === "schoolsServed") {
    return `${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} schools reached`;
  }

  if (key === "unmetHours") {
    return `${Math.abs(diff)} ${diff < 0 ? "fewer" : "more"} uncovered hrs`;
  }

  return `${Math.abs(diff)} ${diff < 0 ? "less" : "more"} weekly travel`;
}

function getMatrixTone(value: number) {
  if (value === 0) {
    return "bg-[#15271e] text-[#d9eadb]";
  }

  if (value <= 4) {
    return "bg-[#344127] text-[#f6efcf]";
  }

  if (value <= 8) {
    return "bg-[#614923] text-[#fff1c8]";
  }

  return "bg-[#6a2b22] text-[#ffe2d8]";
}

function patchAssignments(
  assignments: TeacherAssignment[],
  changes: Record<string, Partial<TeacherAssignment>> | undefined,
) {
  return assignments.map((assignment) => ({
    ...assignment,
    ...(changes?.[assignment.id] ?? {}),
  }));
}

function patchSchools(
  schools: SchoolCoverage[],
  changes: Record<string, Partial<SchoolCoverage>> | undefined,
) {
  return schools.map((school) => ({
    ...school,
    ...(changes?.[school.id] ?? {}),
  }));
}

function getNeedStatus(
  need: UnmetNeed,
  resolvedNeedIds: string[],
  relievedNeedIds: string[],
  pressuredNeedIds: string[],
) {
  if (pressuredNeedIds.includes(need.id)) {
    return {
      label: "At risk after override",
      tone: "border-[#d37b57]/70 bg-[#4e251d]/70 text-[#fce4d7]",
    };
  }

  if (resolvedNeedIds.includes(need.id)) {
    return {
      label: "Covered by funding",
      tone: "border-[#7a997e]/70 bg-[#1f3b31]/70 text-[#d5ead8]",
    };
  }

  if (relievedNeedIds.includes(need.id)) {
    return {
      label: "Reduced by override",
      tone: "border-[#90a86f]/70 bg-[#293f26]/70 text-[#edf4d6]",
    };
  }

  return {
    label: "Still open",
    tone: "border-[#7d6a3a]/70 bg-[#403720]/70 text-[#f7edc9]",
  };
}

function ScreenHeader({
  index,
  title,
  caption,
}: {
  index: string;
  title: string;
  caption: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-[#cf9a49]">
          Screen {index}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f8f2e7]">
          {title}
        </h2>
      </div>
      <p className="max-w-xs text-right text-sm leading-6 text-[#cdbfa6]">{caption}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="metric-card rounded-[24px] border border-white/10 bg-black/15 p-4 shadow-[0_24px_40px_rgba(0,0,0,0.18)]">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
        {label}
      </p>
      <div className="mt-2 text-3xl font-semibold text-[#fff7ec]">{value}</div>
      <p className="mt-2 text-sm text-[#cebfa4]">{delta}</p>
    </div>
  );
}

function MatrixCell({ row, value }: { row: GapRow; value: number }) {
  return (
    <td className="px-2 py-2">
      <div
        className={`min-w-14 rounded-2xl px-3 py-2 text-center text-sm font-semibold ${getMatrixTone(value)}`}
        aria-label={`${row.school}: ${value} hours`}
      >
        {value}
      </div>
    </td>
  );
}

export function PrototypePage() {
  const [scenarioId, setScenarioId] = useState(defaultScenarioId);
  const [assignmentView, setAssignmentView] = useState<AssignmentView>("teacher");
  const [copyLabel, setCopyLabel] = useState("Copy donor briefing");
  const [isPending, startTransition] = useTransition();

  const scenario = getScenarioById(scenarioId);
  const [interventionId, setInterventionId] = useState(scenario.defaultInterventionId);
  const [overrideId, setOverrideId] = useState(scenario.defaultOverrideId);

  const activeIntervention =
    scenario.interventions.find((item) => item.id === interventionId) ?? scenario.interventions[0];
  const activeOverride =
    scenario.overrides.find((item) => item.id === overrideId) ?? scenario.overrides[0];

  const projectedMetrics = applyMetricDelta(
    applyMetricDelta(scenario.optimizedMetrics, activeIntervention.metricDelta),
    activeOverride.metricDelta,
  );

  const assignments = patchAssignments(
    scenario.assignmentsByTeacher,
    activeOverride.assignmentChanges,
  );
  const schoolCoverage = patchSchools(scenario.schoolCoverage, activeOverride.schoolChanges);
  const relievedNeedIds = activeOverride.relievedNeedIds ?? [];
  const pressuredNeedIds = activeOverride.pressuresNeedIds ?? [];
  const unmetNeeds = scenario.unmetNeeds.map((need) => ({
    ...need,
    status: getNeedStatus(
      need,
      activeIntervention.resolvedNeedIds,
      relievedNeedIds,
      pressuredNeedIds,
    ),
  }));

  const unresolvedCount = unmetNeeds.filter(
    (need) => need.status.label !== "Covered by funding",
  ).length;

  const reportText = [
    `Lantern briefing | ${scenario.name}`,
    "",
    `Window: ${scenario.window}`,
    `Track posture: Education primary, Accessibility secondary, Clerkie-compatible reporting story.`,
    "",
    `Problem`,
    `${scenario.story}`,
    "",
    `Operational recommendation`,
    `- Scenario: ${scenario.description}`,
    `- Human review choice: ${activeOverride.name}`,
    `- What-if funding: ${activeIntervention.name}`,
    "",
    `Before vs projected`,
    `- Coverage: ${scenario.baselineMetrics.coverage}% -> ${projectedMetrics.coverage}%`,
    `- Unmet hours: ${scenario.baselineMetrics.unmetHours} -> ${projectedMetrics.unmetHours}`,
    `- Travel distance: ${scenario.baselineMetrics.travelKm} km -> ${projectedMetrics.travelKm} km`,
    `- Schools served: ${scenario.baselineMetrics.schoolsServed} -> ${projectedMetrics.schoolsServed}`,
    "",
    `Why this is credible`,
    `- The system shows what remains unsolved instead of hiding it.`,
    `- Every plan stays reviewable with a visible human override.`,
    `- ${activeIntervention.sponsorAngle}`,
    "",
    `Remaining unmet pockets`,
    ...unmetNeeds
      .filter((need) => need.status.label !== "Covered by funding")
      .map(
        (need) =>
          `- ${need.school}: ${need.subject} (${need.hours} hrs) — ${need.reason}`,
      ),
  ].join("\n");

  async function handleCopyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyLabel("Briefing copied");
    } catch {
      setCopyLabel("Copy failed");
    }

    window.setTimeout(() => {
      setCopyLabel("Copy donor briefing");
    }, 1800);
  }

  return (
    <div className="lantern-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="app-panel relative overflow-hidden rounded-[36px] p-7 sm:p-8">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#d89a3d]/60 to-transparent" />
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-[#cf9a49]">
              Lantern / education access optimizer
            </p>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#fff7eb] sm:text-5xl">
                  Mandatory subjects disappear first in the hardest-to-reach schools.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d2c3aa]">
                  Lantern helps provincial education departments reallocate scarce
                  teachers with better coverage, lower travel burden, and a clear
                  audit trail. It opens on student harm, not on algorithm bragging.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-[#d89a3d]/60 bg-[#433018]/55 px-4 py-2 text-sm text-[#fcecc9]">
                    Education first
                  </span>
                  <span className="rounded-full border border-[#8bab7a]/60 bg-[#233528]/55 px-4 py-2 text-sm text-[#dbebd7]">
                    Accessibility backup
                  </span>
                  <span className="rounded-full border border-[#84a3a2]/60 bg-[#223635]/55 px-4 py-2 text-sm text-[#d9ecea]">
                    Clerkie-compatible reporting
                  </span>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/15 p-5">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                  Pitch spine
                </p>
                <ol className="mt-4 space-y-4 text-sm leading-6 text-[#d7c9af]">
                  <li>1. Show the student harm and the invisible shortage first.</li>
                  <li>2. Reveal the province-wide gap map before showing any solution.</li>
                  <li>3. Present the optimizer as a reviewable draft, not an autonomous decision maker.</li>
                  <li>4. End with what still remains uncovered and what one budget move changes.</li>
                </ol>
              </div>
            </div>
          </section>

          <aside className="app-panel rounded-[36px] p-7 sm:p-8">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-[#cf9a49]">
              Judging posture
            </p>
            <div className="mt-5 space-y-4">
              {scenario.alignment.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-black/15 p-4">
                  <p className="text-sm leading-6 text-[#d8cab2]">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-[#8a7340]/45 bg-[#2d2417]/60 p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                Clerkie angle
              </p>
              <p className="mt-3 text-sm leading-6 text-[#eadfc7]">
                Keep the sponsor story on optimization, reporting, compliance-style
                auditability, and clear operational decisions. Do not force a
                consumer-finance narrative.
              </p>
            </div>
          </aside>
        </header>

        <section className="app-panel mt-6 rounded-[30px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                Demo scenarios
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {scenarios.map((item) => {
                  const active = item.id === scenario.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        startTransition(() => {
                          const next = getScenarioById(item.id);
                          setScenarioId(next.id);
                          setInterventionId(next.defaultInterventionId);
                          setOverrideId(next.defaultOverrideId);
                          setAssignmentView("teacher");
                        })
                      }
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        active
                          ? "border border-[#d89a3d]/70 bg-[#4a3418] text-[#fff1d5]"
                          : "border border-white/10 bg-black/10 text-[#d6c8ad] hover:border-[#d89a3d]/50 hover:text-[#fff0cf]"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-[#cdbfa6]">
                {scenario.window} · {scenario.description}
              </p>
            </div>
            <div
              className={`rounded-full border px-4 py-2 text-sm ${
                isPending
                  ? "border-[#d89a3d]/60 bg-[#4a3418] text-[#fff1d5]"
                  : "border-white/10 bg-black/10 text-[#d6c8ad]"
              }`}
            >
              {isPending ? "Reframing scenario..." : "Draft ready for review"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(metricLabels) as MetricKey[]).map((key) => (
              <MetricCard
                key={key}
                label={metricLabels[key]}
                value={formatMetricValue(key, projectedMetrics[key])}
                delta={describeDelta(key, scenario.baselineMetrics[key], projectedMetrics[key])}
              />
            ))}
          </div>
        </section>

        <main className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="app-panel rounded-[34px] p-6 sm:p-7">
              <ScreenHeader
                index="01"
                title="Input Review"
                caption="Give the officer a clean sanity check before any optimization result appears."
              />
              <div className="grid gap-4 md:grid-cols-2">
                {scenario.inputs.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/8 bg-black/10 p-4">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[#cf9a49]">
                      {item.label}
                    </p>
                    <div className="mt-3 text-3xl font-semibold text-[#fff6e8]">{item.value}</div>
                    <p className="mt-2 text-sm leading-6 text-[#cabca2]">{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[26px] border border-[#7a997e]/35 bg-[#20342c]/45 p-5">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#9db48c]">
                    Operator brief
                  </p>
                  <p className="mt-3 text-base leading-7 text-[#e0f0dc]">{scenario.story}</p>
                </div>
                <div className="rounded-[26px] border border-[#d89a3d]/35 bg-[#3f2d16]/45 p-5">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                    Demo acceptance
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#f1e4cb]">
                    <li>Judges understand the problem in under 60 seconds.</li>
                    <li>The workflow feels like a government officer can actually use it.</li>
                    <li>The system names failures instead of hiding them.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="app-panel rounded-[34px] p-6 sm:p-7">
              <ScreenHeader
                index="02"
                title="Gap Matrix"
                caption="The problem must be visible before the solution is trusted."
              />
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-sm text-[#cabca2]">
                      <th className="px-3 py-2 font-medium">School</th>
                      <th className="px-3 py-2 font-medium">District</th>
                      <th className="px-3 py-2 font-medium">English</th>
                      <th className="px-3 py-2 font-medium">IT</th>
                      <th className="px-3 py-2 font-medium">Arts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.gapMatrix.map((row) => (
                      <tr key={row.school} className="rounded-[24px] bg-black/10">
                        <td className="rounded-l-[22px] px-3 py-3">
                          <div className="font-semibold text-[#fff6e8]">{row.school}</div>
                          <span
                            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs ${priorityClasses[row.priority]}`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-[#d4c5ab]">{row.district}</td>
                        <MatrixCell row={row} value={row.english} />
                        <MatrixCell row={row} value={row.it} />
                        <MatrixCell row={row} value={row.arts} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/8 bg-black/12 p-4">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[#cf9a49]">
                    Why it wins
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#d6c8ad]">
                    This is the screenshot that proves the shortage is not abstract.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-black/12 p-4">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[#cf9a49]">
                    Accessibility angle
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#d6c8ad]">
                    Remote schools stay visible because the table names exactly which students lose access.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-black/12 p-4">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[#cf9a49]">
                    No black box
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#d6c8ad]">
                    The officer sees the shortage first, then decides whether to accept the draft.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="app-panel rounded-[34px] p-6 sm:p-7">
              <ScreenHeader
                index="03"
                title="Assignment Results"
                caption="Keep the optimizer visible, but always subordinate to human review."
              />
              <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
                <div>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setAssignmentView("teacher")}
                      className={`rounded-full px-4 py-2 text-sm ${
                        assignmentView === "teacher"
                          ? "border border-[#d89a3d]/70 bg-[#4a3418] text-[#fff1d5]"
                          : "border border-white/10 bg-black/10 text-[#d6c8ad]"
                      }`}
                    >
                      By teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentView("school")}
                      className={`rounded-full px-4 py-2 text-sm ${
                        assignmentView === "school"
                          ? "border border-[#d89a3d]/70 bg-[#4a3418] text-[#fff1d5]"
                          : "border border-white/10 bg-black/10 text-[#d6c8ad]"
                      }`}
                    >
                      By school
                    </button>
                  </div>

                  <div className="space-y-3">
                    {assignmentView === "teacher"
                      ? assignments.map((assignment) => (
                          <article
                            key={assignment.id}
                            className="rounded-[24px] border border-white/8 bg-black/12 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="text-lg font-semibold text-[#fff5e7]">
                                  {assignment.teacher}
                                </h3>
                                <p className="text-sm text-[#cf9a49]">{assignment.subject}</p>
                              </div>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs ${priorityClasses[assignment.priority]}`}
                              >
                                {assignment.priority}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#d7c9af]">
                              {assignment.route}
                            </p>
                            <div className="mt-4 grid gap-3 text-sm text-[#cabca2] sm:grid-cols-2">
                              <div>
                                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#8aa086]">
                                  Schools
                                </p>
                                <p className="mt-1 text-[#f1e6d1]">{assignment.school}</p>
                              </div>
                              <div>
                                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#8aa086]">
                                  Weekly load
                                </p>
                                <p className="mt-1 text-[#f1e6d1]">{assignment.weeklyHours} hrs</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#cabca2]">{assignment.note}</p>
                          </article>
                        ))
                      : schoolCoverage.map((school) => (
                          <article
                            key={school.id}
                            className="rounded-[24px] border border-white/8 bg-black/12 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="text-lg font-semibold text-[#fff5e7]">
                                  {school.school}
                                </h3>
                                <p className="text-sm text-[#d6c8ad]">{school.district}</p>
                              </div>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs ${priorityClasses[school.priority]}`}
                              >
                                {school.priority}
                              </span>
                            </div>
                            <div className="mt-4 grid gap-3 text-sm text-[#cabca2]">
                              <div>
                                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#8aa086]">
                                  Subjects
                                </p>
                                <p className="mt-1 text-[#f1e6d1]">{school.subjects}</p>
                              </div>
                              <div>
                                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#8aa086]">
                                  Assigned teachers
                                </p>
                                <p className="mt-1 text-[#f1e6d1]">{school.assignedTeachers}</p>
                              </div>
                              <div>
                                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#8aa086]">
                                  Remaining unmet
                                </p>
                                <p className="mt-1 text-[#f1e6d1]">{school.unmetHours} hrs</p>
                              </div>
                            </div>
                          </article>
                        ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-black/14 p-5">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                    Human override
                  </p>
                  <div className="mt-4 space-y-3">
                    {scenario.overrides.map((option) => {
                      const active = option.id === activeOverride.id;

                      return (
                        <label
                          key={option.id}
                          className={`block cursor-pointer rounded-[22px] border p-4 transition ${
                            active
                              ? "border-[#d89a3d]/65 bg-[#433018]/55"
                              : "border-white/8 bg-black/10 hover:border-[#d89a3d]/35"
                          }`}
                        >
                          <input
                            type="radio"
                            name="override"
                            className="sr-only"
                            checked={active}
                            onChange={() =>
                              startTransition(() => {
                                setOverrideId(option.id);
                              })
                            }
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold text-[#fff5e7]">
                                {option.name}
                              </div>
                              <p className="mt-1 text-sm leading-6 text-[#d5c7ad]">
                                {option.summary}
                              </p>
                            </div>
                            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#f7e6bf]">
                              reviewable
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#c9bca4]">{option.impact}</p>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-5 rounded-[22px] border border-[#7a997e]/35 bg-[#20342c]/45 p-4">
                    <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#99b28c]">
                      Why this matters
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#deeed8]">
                      Judges should see the officer can accept the draft, change one
                      human constraint, and immediately understand the cost.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="app-panel rounded-[34px] p-6 sm:p-7">
              <ScreenHeader
                index="04"
                title="Unmet Demand + Export"
                caption="Surface what the system still cannot solve and tie one budget move to measurable impact."
              />
              <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
                <div>
                  <div className="rounded-[28px] border border-white/8 bg-black/14 p-5">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                      What-if funding panel
                    </p>
                    <div className="mt-4 space-y-3">
                      {scenario.interventions.map((option) => {
                        const active = option.id === activeIntervention.id;

                        return (
                          <label
                            key={option.id}
                            className={`block cursor-pointer rounded-[22px] border p-4 transition ${
                              active
                                ? "border-[#8bab7a]/65 bg-[#233528]/60"
                                : "border-white/8 bg-black/10 hover:border-[#8bab7a]/35"
                            }`}
                          >
                            <input
                              type="radio"
                              name="intervention"
                              className="sr-only"
                              checked={active}
                              onChange={() =>
                                startTransition(() => {
                                  setInterventionId(option.id);
                                })
                              }
                            />
                            <div className="text-base font-semibold text-[#fff5e7]">
                              {option.name}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-[#d5c7ad]">
                              {option.summary}
                            </p>
                            <p className="mt-3 text-sm leading-6 text-[#dff0da]">
                              {option.sponsorAngle}
                            </p>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[28px] border border-white/8 bg-black/14 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                        Remaining unmet demand
                      </p>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#f4e5c4]">
                        {unresolvedCount} pockets still visible
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {unmetNeeds.map((need) => (
                        <article
                          key={need.id}
                          className="rounded-[22px] border border-white/8 bg-black/10 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-[#fff5e7]">
                                {need.school}
                              </h3>
                              <p className="text-sm text-[#cf9a49]">
                                {need.subject} · {need.hours} hrs
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs ${need.status.tone}`}
                            >
                              {need.status.label}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#d5c7ad]">{need.reason}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-black/14 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#cf9a49]">
                        Exportable briefing
                      </p>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-[#d6c8ad]">
                        This is the sponsor-compatible layer: a clean report that ties
                        operational choices to measurable outcomes without pretending the
                        system solved everything.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="rounded-full border border-[#d89a3d]/55 bg-[#3f2e18]/65 px-4 py-2 text-sm text-[#fff0cc] transition hover:border-[#e4b25c] hover:bg-[#58401f]"
                    >
                      {copyLabel}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {scenario.reportTakeaways.map((item) => (
                      <div key={item} className="rounded-[22px] border border-white/8 bg-black/10 p-4">
                        <p className="text-sm leading-6 text-[#d8cab1]">{item}</p>
                      </div>
                    ))}
                  </div>

                  <pre className="mt-5 overflow-x-auto rounded-[28px] border border-[#8a7340]/45 bg-[#17120c] p-5 font-mono text-[0.78rem] leading-7 text-[#f2e8d3]">
                    {reportText}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
