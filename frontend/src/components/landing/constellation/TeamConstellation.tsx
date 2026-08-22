import {
  Component,
  lazy,
  Suspense,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { ConstellationFallback } from "./ConstellationFallback";
import type { ConstellationPointer } from "./constellation-data";

const Scene = lazy(async () => {
  const mod = await import("./TeamConstellationScene");
  return { default: mod.TeamConstellationScene };
});

type TeamConstellationProps = {
  pointer: MutableRefObject<ConstellationPointer>;
};

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export function TeamConstellation({ pointer }: TeamConstellationProps) {
  const reducedMotion = usePrefersReducedMotion();

  const fallback = (
    <div className="h-full w-full opacity-90">
      <ConstellationFallback />
    </div>
  );

  if (reducedMotion) return fallback;

  return (
    <SceneErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Scene pointer={pointer} />
      </Suspense>
    </SceneErrorBoundary>
  );
}
