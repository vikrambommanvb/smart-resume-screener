import * as React from "react";
import { Box, Layers } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { SkillsSectionData } from "../../types/api";
import { ConstellationSVG } from "./ConstellationSVG";
import { canUseWebGL } from "./webglCheck";

const LazyScene3D = React.lazy(() => import("./Scene3D"));

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
  onError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class Scene3DErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(): void {
    this.props.onError?.();
  }
  render(): React.ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface ConstellationContainerProps {
  skills: SkillsSectionData | null;
  onSelectSkill?: (skillName: string) => void;
}

export const ConstellationContainer: React.FC<ConstellationContainerProps> = ({
  skills,
  onSelectSkill,
}) => {
  const [use3D, setUse3D] = React.useState<boolean>(false);
  const [isSupported, setIsSupported] = React.useState<boolean>(false);

  React.useEffect(() => {
    const supported = canUseWebGL();
    setIsSupported(supported);
    setUse3D(false);
  }, []);

  const matchedCount = skills?.matched?.length || 0;
  const partialCount = skills?.partial?.length || 0;
  const missingCount = skills?.missing?.length || 0;

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-lg shadow-black/10">
      <CardHeader className="p-6 sm:p-8 pb-5 border-b border-rule/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Skill Constellation Graph</CardTitle>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
              Topological alignment of technical proficiencies relative to role requirements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            {isSupported && (
              <button
                type="button"
                onClick={() => setUse3D(!use3D)}
                className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-3 px-3.5 py-2 text-xs sm:text-sm font-semibold text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus press-scale shadow-sm"
              >
                {use3D ? (
                  <>
                    <Layers className="h-4 w-4 text-cool" aria-hidden="true" />
                    <span>2D view</span>
                  </>
                ) : (
                  <>
                    <Box className="h-4 w-4 text-violet" aria-hidden="true" />
                    <span>3D view</span>
                  </>
                )}
              </button>
            )}

            <Badge variant="brand" className="text-xs px-3 py-1 font-semibold">{use3D ? "3D WebGL" : "2D Vector"}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Render 3D or 2D SVG */}
        <div className="relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center rounded-2xl bg-paper-3/30 border border-rule/50 p-4">
          {use3D && isSupported ? (
            <Scene3DErrorBoundary
              fallback={<ConstellationSVG skills={skills} onSelectSkill={onSelectSkill} />}
              onError={() => {
                setUse3D(false);
                setIsSupported(false);
              }}
            >
              <React.Suspense fallback={<ConstellationSVG skills={skills} onSelectSkill={onSelectSkill} />}>
                <LazyScene3D skills={skills} onSelectSkill={onSelectSkill} />
              </React.Suspense>
            </Scene3DErrorBoundary>
          ) : (
            <ConstellationSVG skills={skills} onSelectSkill={onSelectSkill} />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between border-t border-rule/60 pt-4 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-violet" aria-hidden="true" />
              <span className="text-ink font-medium">Matched ({matchedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-cool" aria-hidden="true" />
              <span className="text-ink font-medium">Partial ({partialCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-ink font-medium">Missing ({missingCount})</span>
            </div>
          </div>
          <span className="text-xs text-muted font-medium">
            {use3D ? "Interactive 3D orbit · Tap node to inspect" : "Deterministic 2D projection"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
