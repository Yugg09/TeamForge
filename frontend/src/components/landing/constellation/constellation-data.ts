export type SkillNodeDef = {
  id: string;
  label: string;
  rest: [number, number, number];
  color: string;
};

const SKILLS: { label: string; color: string }[] = [
  { label: "AI", color: "#0A0A0A" },
  { label: "ML", color: "#1A1A1A" },
  { label: "Backend", color: "#2A2A2A" },
  { label: "Frontend", color: "#3F3F3F" },
  { label: "Design", color: "#525252" },
  { label: "DevOps", color: "#111111" },
  { label: "Data", color: "#404040" },
  { label: "Mobile", color: "#737373" },
  { label: "PM", color: "#171717" },
  { label: "QA", color: "#262626" },
  { label: "Security", color: "#000000" },
  { label: "Cloud", color: "#A3A3A3" },
];

function fibonacciPosition(index: number, total: number): [number, number, number] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (total - 1)) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * index;
  return [
    Math.cos(theta) * radius * 2.05,
    y * 1.15,
    Math.sin(theta) * radius * 2.05,
  ];
}

export const CONSTELLATION_NODES: SkillNodeDef[] = SKILLS.map((skill, index) => ({
  id: skill.label.toLowerCase(),
  label: skill.label,
  rest: fibonacciPosition(index, SKILLS.length),
  color: skill.color,
}));

export const CONSTELLATION_LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 6],
  [1, 2],
  [2, 3],
  [3, 4],
  [3, 7],
  [2, 5],
  [5, 11],
  [5, 10],
  [4, 8],
  [3, 8],
  [2, 9],
  [6, 9],
  [10, 11],
  [7, 3],
];

export const FORMATION_INDICES = [0, 2, 3, 4] as const;

export type ConstellationPointer = { x: number; y: number };
