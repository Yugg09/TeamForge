import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { StepLogEntry } from "@/api/types";
import { scoreToDisplay, stepOpLabel } from "@/lib/team-display";
import { cn } from "@/lib/utils";

type ScoreClimbProps = {
  stepLog: StepLogEntry[];
  className?: string;
  onComplete?: () => void;
};

const STEP_DURATION_MS = 600;
const TOTAL_DURATION_MS = 1800;

export function ScoreClimb({ stepLog, className, onComplete }: ScoreClimbProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(
    stepLog[0]?.total_score ?? 0,
  );
  const [done, setDone] = useState(false);

  const targetScore = stepLog[stepLog.length - 1]?.total_score ?? 0;

  useEffect(() => {
    if (stepLog.length === 0) return;

    setActiveIndex(0);
    setDisplayScore(stepLog[0].total_score);
    setDone(false);

    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    const perStep = Math.min(
      STEP_DURATION_MS,
      Math.floor(TOTAL_DURATION_MS / Math.max(stepLog.length - 1, 1)),
    );

    for (let i = 1; i < stepLog.length; i += 1) {
      stepTimers.push(
        setTimeout(() => {
          setActiveIndex(i);
          setDisplayScore(stepLog[i].total_score);
        }, perStep * i),
      );
    }

    stepTimers.push(
      setTimeout(() => {
        setDone(true);
        onComplete?.();
      }, perStep * stepLog.length + 200),
    );

    return () => stepTimers.forEach(clearTimeout);
  }, [stepLog, onComplete]);

  const chartData = stepLog.map((entry, index) => ({
    step: entry.op,
    index,
    score: scoreToDisplay(entry.total_score),
  }));

  return (
    <section
      className={cn(
        "rounded-xl border border-primary/25 bg-gradient-to-b from-primary/10 to-card p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Optimizing partition
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-start solver with simulated annealing
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-4xl font-bold tabular-nums transition-colors",
              done ? "text-primary" : "text-foreground",
            )}
          >
            {scoreToDisplay(displayScore)}
          </p>
          <p className="text-xs text-muted-foreground">
            target {scoreToDisplay(targetScore)}
          </p>
        </div>
      </div>

      <ol className="mt-5 flex flex-wrap gap-2">
        {stepLog.map((entry, index) => (
          <li
            key={`${entry.op}-${index}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              index <= activeIndex
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-muted/40 text-muted-foreground",
            )}
          >
            {stepOpLabel(entry.op)} · {scoreToDisplay(entry.total_score)}
          </li>
        ))}
      </ol>

      <div className="mt-4 h-28 w-full min-h-[112px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="step"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={["dataMin - 5", "dataMax + 5"]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ fill: "var(--primary)", r: 3 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
