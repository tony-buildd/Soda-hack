export type Priority = "critical" | "watch" | "stable";

export type MetricSnapshot = {
  coverage: number;
  unmetHours: number;
  travelKm: number;
  schoolsServed: number;
};

export type MetricDelta = Partial<MetricSnapshot>;

export type InputSummary = {
  label: string;
  value: string;
  note: string;
};

export type GapRow = {
  school: string;
  district: string;
  priority: Priority;
  english: number;
  it: number;
  arts: number;
};

export type TeacherAssignment = {
  id: string;
  teacher: string;
  subject: string;
  school: string;
  district: string;
  route: string;
  weeklyHours: number;
  note: string;
  priority: Priority;
};

export type SchoolCoverage = {
  id: string;
  school: string;
  district: string;
  subjects: string;
  assignedTeachers: string;
  unmetHours: number;
  priority: Priority;
};

export type UnmetNeed = {
  id: string;
  school: string;
  subject: string;
  hours: number;
  reason: string;
  priority: Priority;
};

export type Intervention = {
  id: string;
  name: string;
  summary: string;
  sponsorAngle: string;
  metricDelta: MetricDelta;
  resolvedNeedIds: string[];
};

export type OverrideOption = {
  id: string;
  name: string;
  summary: string;
  impact: string;
  metricDelta: MetricDelta;
  assignmentChanges?: Record<string, Partial<TeacherAssignment>>;
  schoolChanges?: Record<string, Partial<SchoolCoverage>>;
  relievedNeedIds?: string[];
  pressuresNeedIds?: string[];
};

export type Scenario = {
  id: string;
  name: string;
  window: string;
  description: string;
  story: string;
  inputs: InputSummary[];
  alignment: string[];
  baselineMetrics: MetricSnapshot;
  optimizedMetrics: MetricSnapshot;
  gapMatrix: GapRow[];
  assignmentsByTeacher: TeacherAssignment[];
  schoolCoverage: SchoolCoverage[];
  unmetNeeds: UnmetNeed[];
  interventions: Intervention[];
  overrides: OverrideOption[];
  defaultInterventionId: string;
  defaultOverrideId: string;
  reportTakeaways: string[];
};

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}

export function applyMetricDelta(
  metrics: MetricSnapshot,
  delta: MetricDelta,
): MetricSnapshot {
  return {
    coverage: Math.max(0, Math.min(100, roundMetric(metrics.coverage + (delta.coverage ?? 0)))),
    unmetHours: Math.max(0, roundMetric(metrics.unmetHours + (delta.unmetHours ?? 0))),
    travelKm: Math.max(0, roundMetric(metrics.travelKm + (delta.travelKm ?? 0))),
    schoolsServed: Math.max(0, roundMetric(metrics.schoolsServed + (delta.schoolsServed ?? 0))),
  };
}

export const scenarios: Scenario[] = [
  {
    id: "annual-allocation",
    name: "Annual Allocation",
    window: "July-August planning window",
    description:
      "Build the first defensible province-wide draft before school starts, then let the officer review and override.",
    story:
      "Manual spreadsheets leave remote schools invisible until the first week of class. Lantern brings subject demand, travel burden, and hardship rotation into one draft plan.",
    inputs: [
      {
        label: "Teachers loaded",
        value: "214",
        note: "English, IT, arts, and hardship-posting metadata normalized into one roster.",
      },
      {
        label: "Schools loaded",
        value: "87",
        note: "31 satellite campuses are flagged for heightened equity priority.",
      },
      {
        label: "Subject-hours requested",
        value: "642 / week",
        note: "Mandatory English, IT, and arts demand before the first day of class.",
      },
      {
        label: "Rotations due",
        value: "31",
        note: "Hardship-posting cases that need review before assignments are signed.",
      },
    ],
    alignment: [
      "Education primary: delivers mandatory curriculum where coverage is currently missing.",
      "Accessibility backup: remote and ethnic-minority students gain physical access to qualified teachers.",
      "Clerkie-compatible: turns a manual allocation fight into an auditable decision workflow.",
    ],
    baselineMetrics: {
      coverage: 61,
      unmetHours: 184,
      travelKm: 526,
      schoolsServed: 12,
    },
    optimizedMetrics: {
      coverage: 84,
      unmetHours: 72,
      travelKm: 342,
      schoolsServed: 19,
    },
    gapMatrix: [
      { school: "Din Chin Primary", district: "Meo Vac", priority: "critical", english: 12, it: 0, arts: 6 },
      { school: "Lung Pin Primary", district: "Meo Vac", priority: "watch", english: 0, it: 8, arts: 4 },
      { school: "Sung Tra Primary", district: "Dong Van", priority: "critical", english: 9, it: 0, arts: 0 },
      { school: "Pai Lung Secondary", district: "Dong Van", priority: "watch", english: 0, it: 5, arts: 6 },
      { school: "Xin Cai Primary", district: "Meo Vac", priority: "critical", english: 10, it: 4, arts: 0 },
    ],
    assignmentsByTeacher: [
      {
        id: "ly",
        teacher: "Giang Thi Ly",
        subject: "English",
        school: "Din Chin + Sung Tra",
        district: "Meo Vac / Dong Van",
        route: "Meo Vac hub -> Din Chin -> Sung Tra",
        weeklyHours: 18,
        note: "Covers the highest-priority remote corridor first.",
        priority: "critical",
      },
      {
        id: "khoa",
        teacher: "Lo Van Khoa",
        subject: "IT",
        school: "Pai Lung + Lung Pin",
        district: "Dong Van / Meo Vac",
        route: "Dong Van center -> Pai Lung -> Lung Pin",
        weeklyHours: 16,
        note: "Minimizes travel by clustering neighboring campuses.",
        priority: "watch",
      },
      {
        id: "su",
        teacher: "Tan A Su",
        subject: "Arts",
        school: "Din Chin + Pai Lung",
        district: "Meo Vac / Dong Van",
        route: "Din Chin -> Pai Lung",
        weeklyHours: 15,
        note: "Draft keeps one arts specialist split across both hardship districts.",
        priority: "watch",
      },
      {
        id: "ha",
        teacher: "Nong Thu Ha",
        subject: "English",
        school: "Xin Cai",
        district: "Meo Vac",
        route: "Xin Cai central -> satellite cluster",
        weeklyHours: 14,
        note: "Opens English for a school that received zero specialist coverage last year.",
        priority: "critical",
      },
    ],
    schoolCoverage: [
      {
        id: "dinchin",
        school: "Din Chin Primary",
        district: "Meo Vac",
        subjects: "English + Arts",
        assignedTeachers: "Giang Thi Ly / Tan A Su",
        unmetHours: 6,
        priority: "critical",
      },
      {
        id: "sungtra",
        school: "Sung Tra Primary",
        district: "Dong Van",
        subjects: "English",
        assignedTeachers: "Giang Thi Ly",
        unmetHours: 0,
        priority: "critical",
      },
      {
        id: "lungpin",
        school: "Lung Pin Primary",
        district: "Meo Vac",
        subjects: "IT + Arts",
        assignedTeachers: "Lo Van Khoa / Tan A Su",
        unmetHours: 4,
        priority: "watch",
      },
      {
        id: "xincai",
        school: "Xin Cai Primary",
        district: "Meo Vac",
        subjects: "English",
        assignedTeachers: "Nong Thu Ha",
        unmetHours: 10,
        priority: "critical",
      },
    ],
    unmetNeeds: [
      {
        id: "annual-xincai-english",
        school: "Xin Cai Primary",
        subject: "English",
        hours: 10,
        reason: "Distance threshold blocks a second weekly English visit under current staffing.",
        priority: "critical",
      },
      {
        id: "annual-lungpin-it",
        school: "Lung Pin Primary",
        subject: "IT",
        hours: 8,
        reason: "Only one qualified IT teacher remains after province-wide clustering.",
        priority: "watch",
      },
      {
        id: "annual-pailung-arts",
        school: "Pai Lung Secondary",
        subject: "Arts",
        hours: 6,
        reason: "Rotation rules leave no spare arts specialist inside the feasible corridor.",
        priority: "watch",
      },
    ],
    interventions: [
      {
        id: "none",
        name: "No added funding",
        summary: "Demo the optimizer alone and keep the story focused on better deployment of existing staff.",
        sponsorAngle: "Pure decision support with no budget change.",
        metricDelta: {},
        resolvedNeedIds: [],
      },
      {
        id: "itinerant",
        name: "Fund one itinerant teacher",
        summary: "Add one mobile specialist to cover the furthest corridor two days per week.",
        sponsorAngle: "Shows a measurable coverage lift from one targeted resource decision.",
        metricDelta: { coverage: 5, unmetHours: -18, travelKm: 24, schoolsServed: 1 },
        resolvedNeedIds: ["annual-xincai-english"],
      },
      {
        id: "stipend",
        name: "Hardship stipend for remote corridor",
        summary: "Use a smaller stipend to keep the current arts split viable through the term.",
        sponsorAngle: "Feels like a budget control decision backed by clear impact reporting.",
        metricDelta: { coverage: 3, unmetHours: -12, travelKm: -4, schoolsServed: 0 },
        resolvedNeedIds: ["annual-pailung-arts"],
      },
      {
        id: "replacement",
        name: "Approve one replacement hire",
        summary: "Fill the highest-pressure gap with an emergency English/IT dual-certified hire.",
        sponsorAngle: "Best headline improvement for a donor or director briefing.",
        metricDelta: { coverage: 7, unmetHours: -24, travelKm: 12, schoolsServed: 2 },
        resolvedNeedIds: ["annual-xincai-english", "annual-lungpin-it"],
      },
    ],
    overrides: [
      {
        id: "keep",
        name: "Keep optimizer draft",
        summary: "Fastest route to better coverage before school starts.",
        impact: "Best province-wide coverage with an auditable trail.",
        metricDelta: {},
      },
      {
        id: "rotation",
        name: "Honor Ly's hardship rotation",
        summary: "Move the longest-serving English teacher closer to home and accept narrower remote coverage.",
        impact: "Protects staff fairness but reopens one remote English pocket.",
        metricDelta: { coverage: -4, unmetHours: 16, travelKm: -24, schoolsServed: -1 },
        assignmentChanges: {
          ly: {
            school: "Yen Minh Central",
            district: "Yen Minh",
            route: "Meo Vac hub -> Yen Minh Central",
            weeklyHours: 14,
            note: "Officer override prioritizes a five-year hardship rotation case.",
          },
          ha: {
            route: "Xin Cai central only",
            note: "Narrower route keeps one remote cluster uncovered.",
          },
        },
        schoolChanges: {
          sungtra: {
            assignedTeachers: "Unfilled",
            unmetHours: 9,
          },
        },
        pressuresNeedIds: ["annual-xincai-english"],
      },
      {
        id: "remote-coverage",
        name: "Push English deeper west",
        summary: "Keep the hardship case open one more semester to extend remote English reach.",
        impact: "Improves equity but increases travel and review risk.",
        metricDelta: { coverage: 2, unmetHours: -8, travelKm: 18, schoolsServed: 1 },
        assignmentChanges: {
          ha: {
            school: "Xin Cai + western satellites",
            route: "Xin Cai central -> western satellite cluster",
            weeklyHours: 17,
            note: "Officer override stretches the corridor to reach one more remote school.",
          },
        },
        schoolChanges: {
          xincai: {
            assignedTeachers: "Nong Thu Ha + rotating support",
            unmetHours: 4,
          },
        },
        relievedNeedIds: ["annual-xincai-english"],
      },
    ],
    defaultInterventionId: "none",
    defaultOverrideId: "keep",
    reportTakeaways: [
      "Use the hero story to show student harm before you talk about optimization.",
      "Judges should see one human override and its trade-off in under a minute.",
      "The export view turns the demo from an algorithm into an adoption-ready workflow.",
    ],
  },
  {
    id: "midyear-emergency",
    name: "Mid-Year Emergency",
    window: "October disruption response",
    description:
      "Re-run the plan after a resignation and find the least-disruptive replacement path while keeping the coverage map honest.",
    story:
      "A single teacher exit can erase a mandatory subject for weeks. This scenario shows the officer how to react without another spreadsheet scramble.",
    inputs: [
      {
        label: "Active teachers",
        value: "206",
        note: "One English specialist resigned in week six of term.",
      },
      {
        label: "Affected schools",
        value: "18",
        note: "Only schools in the impacted corridor are re-solved for minimal disruption.",
      },
      {
        label: "Students exposed",
        value: "1,240",
        note: "Grade 3 English and lower-secondary arts are the immediate risks.",
      },
      {
        label: "Decision deadline",
        value: "72 hours",
        note: "The officer must publish a recovery plan before the next timetable cycle.",
      },
    ],
    alignment: [
      "Education primary: stops mandatory subjects from disappearing mid-semester.",
      "Accessibility backup: reduces the chance that remote students lose a full term of English.",
      "Clerkie-compatible: fast re-forecasting, auditability, and action-ready reporting.",
    ],
    baselineMetrics: {
      coverage: 68,
      unmetHours: 96,
      travelKm: 274,
      schoolsServed: 14,
    },
    optimizedMetrics: {
      coverage: 79,
      unmetHours: 51,
      travelKm: 248,
      schoolsServed: 16,
    },
    gapMatrix: [
      { school: "Pho Bang Primary", district: "Dong Van", priority: "critical", english: 10, it: 0, arts: 0 },
      { school: "Lung Cu Primary", district: "Dong Van", priority: "watch", english: 6, it: 0, arts: 3 },
      { school: "Sa Phin Secondary", district: "Dong Van", priority: "critical", english: 0, it: 0, arts: 8 },
      { school: "Sung La Primary", district: "Dong Van", priority: "watch", english: 4, it: 0, arts: 0 },
    ],
    assignmentsByTeacher: [
      {
        id: "mai",
        teacher: "Vu Thi Mai",
        subject: "English",
        school: "Pho Bang + Sung La",
        district: "Dong Van",
        route: "Dong Van center -> Pho Bang -> Sung La",
        weeklyHours: 17,
        note: "Reroute uses the nearest available English specialist first.",
        priority: "critical",
      },
      {
        id: "hien",
        teacher: "Do Hien",
        subject: "Arts",
        school: "Sa Phin",
        district: "Dong Van",
        route: "Sa Phin loop",
        weeklyHours: 14,
        note: "Single-campus arts coverage keeps timetables stable after the resignation.",
        priority: "watch",
      },
      {
        id: "bich",
        teacher: "Pham Ngoc Bich",
        subject: "English",
        school: "Lung Cu",
        district: "Dong Van",
        route: "Lung Cu ring road",
        weeklyHours: 13,
        note: "Lowest-disruption reassignment that still reaches the border cluster.",
        priority: "critical",
      },
    ],
    schoolCoverage: [
      {
        id: "phobang",
        school: "Pho Bang Primary",
        district: "Dong Van",
        subjects: "English",
        assignedTeachers: "Vu Thi Mai",
        unmetHours: 4,
        priority: "critical",
      },
      {
        id: "lungcu",
        school: "Lung Cu Primary",
        district: "Dong Van",
        subjects: "English + Arts",
        assignedTeachers: "Pham Ngoc Bich",
        unmetHours: 3,
        priority: "watch",
      },
      {
        id: "saphin",
        school: "Sa Phin Secondary",
        district: "Dong Van",
        subjects: "Arts",
        assignedTeachers: "Do Hien",
        unmetHours: 2,
        priority: "critical",
      },
    ],
    unmetNeeds: [
      {
        id: "midyear-phobang-english",
        school: "Pho Bang Primary",
        subject: "English",
        hours: 6,
        reason: "One resignation removes the only spare English day in the corridor.",
        priority: "critical",
      },
      {
        id: "midyear-saphin-arts",
        school: "Sa Phin Secondary",
        subject: "Arts",
        hours: 8,
        reason: "Arts specialist capacity is capped at one full route without extra support.",
        priority: "watch",
      },
      {
        id: "midyear-lungcu-english",
        school: "Lung Cu Primary",
        subject: "English",
        hours: 4,
        reason: "Travel time creates a partial coverage gap even after re-solving.",
        priority: "watch",
      },
    ],
    interventions: [
      {
        id: "none",
        name: "No added funding",
        summary: "Show the district-level reallocation alone and prove the workflow works under pressure.",
        sponsorAngle: "Fast response with no extra headcount.",
        metricDelta: {},
        resolvedNeedIds: [],
      },
      {
        id: "replacement",
        name: "Emergency replacement hire",
        summary: "Approve a short-term replacement so the system can close the English gap immediately.",
        sponsorAngle: "Best sponsor-friendly before/after report for leadership.",
        metricDelta: { coverage: 7, unmetHours: -20, travelKm: 8, schoolsServed: 1 },
        resolvedNeedIds: ["midyear-phobang-english", "midyear-lungcu-english"],
      },
      {
        id: "stipend",
        name: "Retention stipend for current corridor",
        summary: "Use a smaller budget lever to keep the remaining staff on the route without burnout.",
        sponsorAngle: "Budget-sensitive option with measurable resilience.",
        metricDelta: { coverage: 3, unmetHours: -10, travelKm: -6, schoolsServed: 0 },
        resolvedNeedIds: ["midyear-saphin-arts"],
      },
      {
        id: "itinerant",
        name: "Fund one temporary itinerant",
        summary: "Add a mobile backup teacher for the border schools while the full vacancy remains open.",
        sponsorAngle: "Clear what-if funding story for donors.",
        metricDelta: { coverage: 5, unmetHours: -15, travelKm: 18, schoolsServed: 1 },
        resolvedNeedIds: ["midyear-phobang-english"],
      },
    ],
    overrides: [
      {
        id: "keep",
        name: "Keep optimizer draft",
        summary: "Minimizes disruption and restores the broadest coverage within 72 hours.",
        impact: "Best balance of speed, coverage, and travel.",
        metricDelta: {},
      },
      {
        id: "protect-town-campus",
        name: "Protect town-campus timetable",
        summary: "Hold the nearest English teacher at the main campus and accept weaker border coverage.",
        impact: "Lower operational chaos, worse equity outcome.",
        metricDelta: { coverage: -3, unmetHours: 11, travelKm: -14, schoolsServed: -1 },
        assignmentChanges: {
          mai: {
            school: "Pho Bang only",
            route: "Dong Van center -> Pho Bang",
            weeklyHours: 12,
            note: "Override removes the second satellite stop to protect the town timetable.",
          },
        },
        schoolChanges: {
          lungcu: {
            assignedTeachers: "Unfilled",
            unmetHours: 7,
          },
        },
        pressuresNeedIds: ["midyear-lungcu-english"],
      },
      {
        id: "stretch-arts",
        name: "Split arts across two campuses",
        summary: "Ask the arts specialist to cover one extra satellite while the emergency holds.",
        impact: "Stronger student access at the cost of travel and burnout risk.",
        metricDelta: { coverage: 2, unmetHours: -6, travelKm: 16, schoolsServed: 1 },
        assignmentChanges: {
          hien: {
            school: "Sa Phin + Lung Cu",
            route: "Sa Phin -> Lung Cu relay",
            weeklyHours: 17,
            note: "Override stretches one specialist to avoid a full arts shutdown.",
          },
        },
        schoolChanges: {
          saphin: {
            unmetHours: 1,
          },
          lungcu: {
            assignedTeachers: "Pham Ngoc Bich / Do Hien",
            unmetHours: 1,
          },
        },
        relievedNeedIds: ["midyear-saphin-arts"],
      },
    ],
    defaultInterventionId: "none",
    defaultOverrideId: "keep",
    reportTakeaways: [
      "The mid-year scenario proves the product is useful outside the annual allocation cycle.",
      "Judge-friendly phrasing: 'We reduce replacement time from weeks to hours.'",
      "Keep the override visible so the demo feels like a human-operated system, not a black box.",
    ],
  },
  {
    id: "donor-briefing",
    name: "Director / Donor Briefing",
    window: "Budget cycle and reporting window",
    description:
      "Package the allocation story into a report that can justify funding asks, hardship stipends, or additional headcount.",
    story:
      "Leadership already knows there is a problem. This scenario shows exactly where the unmet demand sits, what one budget move changes, and what still remains unsolved.",
    inputs: [
      {
        label: "Province snapshot",
        value: "96 schools",
        note: "Cross-district view focused on the highest-need mountainous corridor.",
      },
      {
        label: "Open vacancies",
        value: "14",
        note: "Vacancies remain open despite approved staffing positions.",
      },
      {
        label: "Priority campuses",
        value: "22",
        note: "Satellite schools with repeated curriculum interruption across two years.",
      },
      {
        label: "Report audience",
        value: "Director + donors",
        note: "Needs plain-language impact numbers, not solver internals.",
      },
    ],
    alignment: [
      "Education primary: turns invisible teaching gaps into a clear action plan.",
      "Accessibility backup: explicitly names which remote schools remain excluded.",
      "Clerkie-compatible: strongest fit because the export and reporting workflow is front-and-center.",
    ],
    baselineMetrics: {
      coverage: 58,
      unmetHours: 203,
      travelKm: 488,
      schoolsServed: 11,
    },
    optimizedMetrics: {
      coverage: 81,
      unmetHours: 83,
      travelKm: 331,
      schoolsServed: 18,
    },
    gapMatrix: [
      { school: "Na Chi Primary", district: "Xin Man", priority: "critical", english: 10, it: 4, arts: 0 },
      { school: "Ban Phung Primary", district: "Hoang Su Phi", priority: "critical", english: 8, it: 0, arts: 6 },
      { school: "Ta Su Choong Secondary", district: "Hoang Su Phi", priority: "watch", english: 0, it: 6, arts: 4 },
      { school: "Niem Tong Primary", district: "Quan Ba", priority: "watch", english: 5, it: 0, arts: 3 },
      { school: "Lung Tam Primary", district: "Quan Ba", priority: "stable", english: 2, it: 0, arts: 0 },
    ],
    assignmentsByTeacher: [
      {
        id: "long",
        teacher: "Bui Duc Long",
        subject: "English",
        school: "Na Chi + Ban Phung",
        district: "Xin Man / Hoang Su Phi",
        route: "Xin Man center -> Na Chi -> Ban Phung",
        weeklyHours: 18,
        note: "One route now covers two schools that previously competed for the same teacher.",
        priority: "critical",
      },
      {
        id: "trang",
        teacher: "Le Thi Trang",
        subject: "IT",
        school: "Ta Su Choong",
        district: "Hoang Su Phi",
        route: "Hoang Su Phi ridge road",
        weeklyHours: 15,
        note: "Keeps the integrated-subject shortage visible but partially covered.",
        priority: "watch",
      },
      {
        id: "duyen",
        teacher: "Hoang Duyen",
        subject: "Arts",
        school: "Ban Phung + Niem Tong",
        district: "Hoang Su Phi / Quan Ba",
        route: "Ban Phung -> Niem Tong connector",
        weeklyHours: 16,
        note: "Highest-value arts split the province can sustain without new headcount.",
        priority: "watch",
      },
    ],
    schoolCoverage: [
      {
        id: "nachi",
        school: "Na Chi Primary",
        district: "Xin Man",
        subjects: "English + IT",
        assignedTeachers: "Bui Duc Long",
        unmetHours: 5,
        priority: "critical",
      },
      {
        id: "banphung",
        school: "Ban Phung Primary",
        district: "Hoang Su Phi",
        subjects: "English + Arts",
        assignedTeachers: "Bui Duc Long / Hoang Duyen",
        unmetHours: 4,
        priority: "critical",
      },
      {
        id: "tasu",
        school: "Ta Su Choong Secondary",
        district: "Hoang Su Phi",
        subjects: "IT + Arts",
        assignedTeachers: "Le Thi Trang / Hoang Duyen",
        unmetHours: 6,
        priority: "watch",
      },
    ],
    unmetNeeds: [
      {
        id: "donor-nachi-it",
        school: "Na Chi Primary",
        subject: "IT",
        hours: 9,
        reason: "Province still has only one IT specialist in the feasible radius.",
        priority: "critical",
      },
      {
        id: "donor-banphung-arts",
        school: "Ban Phung Primary",
        subject: "Arts",
        hours: 6,
        reason: "Shared arts route reaches the school, but not for full timetable coverage.",
        priority: "watch",
      },
      {
        id: "donor-niemtong-english",
        school: "Niem Tong Primary",
        subject: "English",
        hours: 5,
        reason: "One additional English day would unlock a full two-session timetable.",
        priority: "watch",
      },
    ],
    interventions: [
      {
        id: "none",
        name: "No added funding",
        summary: "Use the report to show how much inequity can already be removed with better allocation alone.",
        sponsorAngle: "Pure reporting and auditability story.",
        metricDelta: {},
        resolvedNeedIds: [],
      },
      {
        id: "stipend",
        name: "Hardship stipend package",
        summary: "Retain remote-route teachers for the full year and protect fragile coverage gains.",
        sponsorAngle: "Budget ask with clear operational return.",
        metricDelta: { coverage: 4, unmetHours: -14, travelKm: -8, schoolsServed: 1 },
        resolvedNeedIds: ["donor-banphung-arts"],
      },
      {
        id: "itinerant",
        name: "Fund one itinerant IT teacher",
        summary: "Close the most visible curriculum gap in the province-wide report.",
        sponsorAngle: "Most legible what-if chart for a donor deck.",
        metricDelta: { coverage: 6, unmetHours: -22, travelKm: 20, schoolsServed: 1 },
        resolvedNeedIds: ["donor-nachi-it"],
      },
      {
        id: "replacement",
        name: "Approve one additional English hire",
        summary: "Use the report to justify a new English position in the most underserved corridor.",
        sponsorAngle: "Clear connection between budget request and schools newly served.",
        metricDelta: { coverage: 5, unmetHours: -17, travelKm: 10, schoolsServed: 2 },
        resolvedNeedIds: ["donor-niemtong-english"],
      },
    ],
    overrides: [
      {
        id: "keep",
        name: "Keep optimizer draft",
        summary: "Best headline improvement for the report and the cleanest story for judges.",
        impact: "Strongest before/after narrative.",
        metricDelta: {},
      },
      {
        id: "protect-main-campus",
        name: "Protect main-campus performance",
        summary: "Reduce remote travel to keep staff concentrated at larger schools.",
        impact: "Looks operationally safer but weakens the equity case.",
        metricDelta: { coverage: -3, unmetHours: 12, travelKm: -18, schoolsServed: -1 },
        assignmentChanges: {
          long: {
            school: "Na Chi only",
            route: "Xin Man center -> Na Chi",
            weeklyHours: 14,
            note: "Override trims the longest route to protect the main campus schedule.",
          },
        },
        schoolChanges: {
          banphung: {
            assignedTeachers: "Hoang Duyen",
            unmetHours: 9,
          },
        },
        pressuresNeedIds: ["donor-niemtong-english"],
      },
      {
        id: "expand-satellites",
        name: "Expand to highest-need satellites",
        summary: "Accept extra travel to demonstrate the strongest remote-access story in the report.",
        impact: "Better accessibility narrative, more strain on the route network.",
        metricDelta: { coverage: 1, unmetHours: -5, travelKm: 24, schoolsServed: 1 },
        assignmentChanges: {
          duyen: {
            school: "Ban Phung + Niem Tong + satellite arts cluster",
            route: "Ban Phung -> Niem Tong -> satellite arts loop",
            weeklyHours: 18,
            note: "Override leans harder into underserved satellite coverage.",
          },
        },
        schoolChanges: {
          banphung: {
            unmetHours: 2,
          },
        },
        relievedNeedIds: ["donor-banphung-arts"],
      },
    ],
    defaultInterventionId: "none",
    defaultOverrideId: "keep",
    reportTakeaways: [
      "This is the strongest Clerkie-adjacent scene because reporting and what-if budgeting stay on screen.",
      "Use the copy-to-briefing action to show exportability, not just analytics.",
      "End the demo by naming what still remains uncovered; that makes the product credible.",
    ],
  },
];

const scenarioMap = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

export const defaultScenarioId = scenarios[0].id;

export function getScenarioById(id: string) {
  const scenario = scenarioMap.get(id);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }

  return scenario;
}
