import type { Ambition, RoleId } from "@/api/types";

export const ROLE_OPTIONS: { value: RoleId; label: string }[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "ai_ml", label: "AI / ML" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
  { value: "research", label: "Research" },
  { value: "devops", label: "DevOps" },
];

export const CANONICAL_SKILLS: { id: string; label: string }[] = [
  { id: "react", label: "React" },
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "fastapi", label: "FastAPI" },
  { id: "node", label: "Node.js" },
  { id: "pytorch", label: "PyTorch" },
  { id: "tensorflow", label: "TensorFlow" },
  { id: "figma", label: "Figma" },
  { id: "docker", label: "Docker" },
  { id: "postgres", label: "PostgreSQL" },
  { id: "css", label: "CSS" },
  { id: "graphql", label: "GraphQL" },
  { id: "ui_ux", label: "UI/UX" },
];

export const AMBITION_OPTIONS: { value: Ambition; label: string }[] = [
  { value: "win", label: "Win the hackathon" },
  { value: "ship", label: "Ship a working product" },
  { value: "learn", label: "Learn and experiment" },
];

export const WORK_STYLE_OPTIONS = [
  { value: "planner" as const, label: "Planner" },
  { value: "improviser" as const, label: "Improviser" },
];

export const SYNC_PREF_OPTIONS = [
  { value: "sync" as const, label: "Synchronous (live meetings)" },
  { value: "async" as const, label: "Asynchronous (async-first)" },
];

export const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const TIMEZONE_PRESETS = [
  { label: "UTC", offset: 0 },
  { label: "EST (UTC−5)", offset: -300 },
  { label: "PST (UTC−8)", offset: -480 },
  { label: "IST (UTC+5:30)", offset: 330 },
  { label: "CET (UTC+1)", offset: 60 },
];

export function proficiencyLabel(level: number): string {
  switch (level) {
    case 1:
      return "Exposure";
    case 2:
      return "Familiar";
    case 3:
      return "Comfortable";
    case 4:
      return "Strong";
    case 5:
      return "Expert";
    default:
      return "";
  }
}

export function proficiencyDisplay(level: number): string {
  return proficiencyLabel(level);
}
