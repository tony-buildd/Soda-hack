export const COLORS = {
  bg: "#f5f8f3",
  card: "#ffffff",
  ink: "#12312b",
  muted: "#4c6b63",
  line: "#d5e0d8",
  accent: "#d66c2f",
  accent2: "#2f9d8f",
  teacher: "#277da1",
  school: "#e76f51",
} as const;

export const API_URLS = {
  current: "/api/optimizer/current",
  history: "/api/optimizer/history",
  runJson: "/api/optimizer/json",
  runCsv: "/api/optimizer/csv",
  csvTemplate: "/api/optimizer/csv-template",
} as const;
