import * as React from "react";
import { ChevronDown, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { MatchSectionData } from "../../types/api";
import { cn } from "../../lib/utils";

interface ScoreSummaryProps {
  data: MatchSectionData;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ data }) => {
  const [showBreakdownDetails, setShowBreakdownDetails] = React.useState(false);
  const [animatedScore, setAnimatedScore] = React.useState(data.total_score);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.requestAnimationFrame) {
      setAnimatedScore(data.total_score);
      return;
    }
    const end = data.total_score;
    const duration = 500;
    const startTime = performance.now();

    const frame = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * end));
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  }, [data.total_score]);

  // 270-degree arc calculations:
  // Center (110, 110), radius = 85
  // 270 deg = 0.75 of full circle circumference
  const radius = 85;
  const fullCircumference = 2 * Math.PI * radius;
  const arcLength = fullCircumference * 0.75;
  const safeScore = typeof data.total_score === "number" && !isNaN(data.total_score) ? data.total_score : 0;
  const progressOffset = arcLength - (safeScore / 100) * arcLength;

  const bandLabel =
    {
      strong: "Strong alignment",
      solid: "Solid alignment",
      partial: "Partial alignment",
      needs_rework: "Needs revision",
      weak: "Needs revision",
    }[data.band as string] || "Partial alignment";

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-sm">
      <CardHeader className="p-6 sm:p-8 pb-6 border-b border-rule/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Match estimate</CardTitle>
            <p className="text-sm text-ink-2 leading-relaxed">
              Deterministic alignment with the target role, not an employer ATS prediction.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            <Badge variant="brand" className="text-xs px-3 py-1 font-semibold">{bandLabel}</Badge>
            <span className="flex items-center gap-1.5 text-xs text-ink-2 bg-paper-3 px-3 py-1 rounded-md border border-rule font-medium">
              <ShieldCheck className="h-4 w-4 text-cool" aria-hidden="true" />
              <span className="capitalize">{data.confidence} confidence</span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 lg:p-10 space-y-12">
        {/* Dominant Hero Score Stage */}
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
            <svg className="w-full h-full rotate-[135deg] transform" viewBox="0 0 220 220" aria-hidden="true">
              {/* Background 270 deg Track */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="var(--color-rule)"
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${fullCircumference}`}
                strokeLinecap="round"
                fill="transparent"
              />
              {/* Score Arc */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="var(--color-accent)"
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${fullCircumference}`}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>

            {/* Center Readout */}
            <div className="absolute flex flex-col items-center text-center">
              <span className="font-display font-outlier text-7xl sm:text-8xl font-medium tracking-tight text-ink tabular-nums">
                {animatedScore}
              </span>
              <span className="sr-only">{data.total_score} out of 100</span>
              <span className="text-sm text-muted font-medium mt-1">
                Score / 100
              </span>
            </div>
          </div>

          {/* Threshold Legend */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted pt-4">
            <span className="px-2.5 py-1 rounded-md bg-paper-3 border border-rule font-medium">40 partial</span>
            <span className="px-2.5 py-1 rounded-md bg-paper-3 border border-rule font-medium">60 solid</span>
            <span className="px-2.5 py-1 rounded-md bg-paper-3 border border-rule font-medium">80 strong</span>
          </div>

          {/* Permitted Exception d: Score disclaimer */}
          <p className="text-xs sm:text-sm text-ink-2/90 text-center max-w-md mt-4 leading-relaxed">
            This score estimates how closely your resume lines up with this role. It is not what an employer&apos;s hiring system calculates.
          </p>
        </div>

        {/* Component Breakdown Modules */}
        <div className="space-y-6 pt-6 border-t border-rule/80">
          <div className="flex items-center justify-between pb-2 border-b border-rule/60">
            <div>
              <h3 className="text-base sm:text-lg text-ink font-semibold">
                Alignment components
              </h3>
              <p className="text-xs text-muted">Rigid mathematical weights applied to your verified background.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBreakdownDetails((prev) => !prev)}
              className="text-xs text-violet hover:text-ink flex items-center gap-1.5 cursor-pointer font-medium focus-visible:outline-none transition-colors"
            >
              <span>{showBreakdownDetails ? "Hide explanation" : "Why this score"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showBreakdownDetails && "rotate-180")} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.components || {}).map(([key, comp]) => {
              const displayLabels: Record<string, string> = {
                skills: "Required skills (40 pts)",
                responsibilities: "Responsibilities (25 pts)",
                experience: "Experience depth (15 pts)",
                projects: "Projects (15 pts)",
                education: "Education & credentials (5 pts)",
              };
              const title = comp.name || displayLabels[key] || `${key} (${comp.max_points} pts)`;

              return (
                <div key={key} className="p-5 rounded-2xl bg-paper-3/40 border border-rule/70 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="font-semibold text-ink">{title}</span>
                      <span className="font-outlier text-accent tabular-nums font-semibold shrink-0">
                        {comp.percentage}%
                      </span>
                    </div>
                    <span className="font-outlier text-xs text-muted tabular-nums block font-medium">
                      {comp.points} of {comp.max_points} pts
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2.5 w-full rounded-full bg-paper-3 overflow-hidden border border-rule/60">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.min(100, comp.percentage)}%` }}
                      />
                    </div>
                    {showBreakdownDetails && comp.explanation && (
                      <p className="text-xs text-ink-2 pt-2 leading-relaxed border-t border-rule/40">
                        {comp.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest Impact Improvements */}
        {data.biggest_movers && data.biggest_movers.length > 0 && (
          <div className="rounded-2xl bg-paper-3/40 p-6 sm:p-8 border border-rule/80 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base text-ink font-semibold">
                <TrendingUp className="h-5 w-5 text-accent" aria-hidden="true" />
                <span>Highest impact improvements</span>
              </div>
              <p className="text-xs text-muted">Targeting these missing proficiencies yields the greatest score increase.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.biggest_movers.slice(0, 3).map((mover) => (
                <div
                  key={mover.skill_id}
                  className="rounded-xl bg-paper-2 p-5 border border-rule/80 hover:border-accent/40 transition-colors shadow-sm flex flex-col justify-between space-y-4"
                >
                  <p className="text-base font-semibold text-ink truncate">{mover.skill_name}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-rule/50">
                    <span className="text-xs text-muted capitalize font-medium">{mover.category}</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-accent-soft text-accent border border-accent/30 font-outlier text-xs font-semibold tabular-nums">
                      +{mover.potential_points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
