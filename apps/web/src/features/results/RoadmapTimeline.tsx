import * as React from "react";
import { CheckSquare, Clock, ExternalLink, Square } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { RoadmapStep } from "../../types/api";

interface RoadmapTimelineProps {
  steps: RoadmapStep[];
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ steps }) => {
  const [completedActions, setCompletedActions] = React.useState<Set<string>>(new Set());

  const toggleAction = (actionKey: string) => {
    setCompletedActions((prev) => {
      const next = new Set(prev);
      if (next.has(actionKey)) next.delete(actionKey);
      else next.add(actionKey);
      return next;
    });
  };

  if (!steps || steps.length === 0) {
    return (
      <Card className="bg-paper-2 border border-rule/80">
        <CardContent className="p-8 sm:p-12 text-center text-ink-2 text-sm sm:text-base">
          No roadmap steps available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-lg shadow-black/10">
      <CardHeader className="p-6 sm:p-8 pb-5 border-b border-rule/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Learning roadmap</CardTitle>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
              Targeted resources from our verified catalog to bridge identified gaps.
            </p>
          </div>
          <Badge variant="brand" className="text-xs px-3 py-1 font-semibold">Verified catalog links</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-8">
        <div className="relative border-l-2 border-rule/70 ml-4 space-y-10 pl-6 sm:pl-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative space-y-4">
              {/* Timeline Sequence Number Marker */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-paper-2 border-2 border-rule text-xs sm:text-sm font-outlier font-semibold text-ink shadow-md">
                {idx + 1}
              </div>

              {/* Milestone & Estimated Hours */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-violet">
                  {step.milestone}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted bg-paper-3 px-3 py-1 rounded-md border border-rule font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  <span className="font-outlier tabular-nums">Est. {step.est_hours} hours</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-display text-lg sm:text-xl font-medium text-ink">{step.goal}</h4>
                <p className="text-sm text-ink-2 leading-relaxed">{step.why_it_matters}</p>
              </div>

              {/* Interactive Checklist */}
              {step.actions && step.actions.length > 0 && (
                <div className="rounded-xl bg-paper-3/50 p-4 sm:p-5 space-y-3 border border-rule/70">
                  <span className="text-xs font-medium text-ink-2">
                    Action checklist
                  </span>
                  <div className="space-y-2.5">
                    {step.actions.map((action, aIdx) => {
                      const actionKey = `${idx}-${aIdx}`;
                      const isDone = completedActions.has(actionKey);
                      return (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => toggleAction(actionKey)}
                          className="min-h-[44px] flex items-center gap-3 text-sm text-left w-full hover:text-ink transition-colors cursor-pointer select-none p-2 rounded-lg hover:bg-paper-2/70 press-scale"
                        >
                          {isDone ? (
                            <CheckSquare className="h-5 w-5 text-ok shrink-0" aria-hidden="true" />
                          ) : (
                            <Square className="h-5 w-5 text-muted shrink-0" aria-hidden="true" />
                          )}
                          <span className={isDone ? "line-through text-muted" : "text-ink font-normal"}>{action}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verified Catalog Resources */}
              {step.resources && step.resources.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-medium text-ink-2">
                    Verified learning resources
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {step.resources.map((res, rIdx) => (
                      <a
                        key={res.id || `res-${rIdx}`}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-xl bg-paper-3/40 border border-rule/70 hover:border-violet/40 hover:bg-paper-2 transition-colors group press-scale shadow-sm"
                      >
                        <div className="min-w-0 pr-3 space-y-1">
                          <p className="font-semibold text-sm text-ink group-hover:text-violet transition-colors truncate">
                            {res.title}
                          </p>
                          <span className="text-xs text-muted block">
                            {res.platform} · {res.type}
                          </span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted group-hover:text-violet transition-colors shrink-0" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
