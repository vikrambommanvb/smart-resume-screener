import * as React from "react";
import { FileSearch, X, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { MatchedSkillItem, MissingSkillItem, SkillsSectionData } from "../../types/api";

interface SkillsMatrixProps {
  data: SkillsSectionData;
}

export const SkillsMatrix: React.FC<SkillsMatrixProps> = ({ data }) => {
  const [filter, setFilter] = React.useState<"all" | "matched" | "partial" | "missing">("all");
  const [inspectEvidence, setInspectEvidence] = React.useState<{ name: string; quote: string; category?: string } | null>(null);

  const matched = data.matched || [];
  const partial = data.partial || [];
  const missing = data.missing || [];

  const allItems: Array<
    | { type: "matched"; item: MatchedSkillItem }
    | { type: "partial"; item: MatchedSkillItem }
    | { type: "missing"; item: MissingSkillItem }
  > = [
    ...matched.map((m) => ({ type: "matched" as const, item: m })),
    ...partial.map((p) => ({ type: "partial" as const, item: p })),
    ...missing.map((g) => ({ type: "missing" as const, item: g })),
  ];

  const filteredItems = allItems.filter((entry) => {
    if (filter === "all") return true;
    return entry.type === filter;
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inspectEvidence) {
        setInspectEvidence(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectEvidence]);

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-lg shadow-black/10">
      <CardHeader className="p-6 sm:p-8 pb-5 border-b border-rule/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Required skills</CardTitle>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
              Extracted skills cross-checked with verified context quotes from your resume.
            </p>
          </div>

          {/* Filter Pills with min 44px hit targets */}
          <div className="flex flex-wrap rounded-xl bg-paper-3 p-1 border border-rule text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer press-scale ${
                filter === "all" ? "bg-paper-2 text-ink font-semibold shadow-sm border border-rule/60" : "text-ink-2 hover:text-ink"
              }`}
            >
              All (<span className="font-outlier">{allItems.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilter("matched")}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer press-scale ${
                filter === "matched" ? "bg-paper-2 text-violet font-semibold shadow-sm border border-violet/30" : "text-ink-2 hover:text-ink"
              }`}
            >
              Matched (<span className="font-outlier">{matched.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilter("partial")}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer press-scale ${
                filter === "partial" ? "bg-paper-2 text-cool font-semibold shadow-sm border border-cool/30" : "text-ink-2 hover:text-ink"
              }`}
            >
              Partial (<span className="font-outlier">{partial.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilter("missing")}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer press-scale ${
                filter === "missing" ? "bg-paper-2 text-accent font-semibold shadow-sm border border-accent/30" : "text-ink-2 hover:text-ink"
              }`}
            >
              Missing (<span className="font-outlier">{missing.length}</span>)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="space-y-3">
          {filteredItems.map(({ type, item }, idx) => {
            const hasEvidence = "evidence" in item && Boolean(item.evidence);
            return (
              <div
                key={`${item?.id || idx}-${idx}`}
                id={`skill-row-${item?.id || idx}`}
                tabIndex={0}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl border border-rule/70 bg-paper-3/40 hover:bg-paper-2/90 hover:border-rule-2 transition-colors gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  {/* Distinct Shape, Text, and Colour (Permitted Exception f) */}
                  {type === "matched" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-soft text-violet border border-violet/30 shrink-0">
                      <span className="text-sm leading-none" aria-hidden="true">●</span>
                      <span>Match</span>
                    </span>
                  )}
                  {type === "partial" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cool-soft text-cool border border-cool/30 shrink-0">
                      <span className="text-sm leading-none" aria-hidden="true">◐</span>
                      <span>Partial</span>
                    </span>
                  )}
                  {type === "missing" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-accent-soft text-accent border border-accent/30 shrink-0">
                      <span className="text-sm leading-none" aria-hidden="true">○</span>
                      <span>Gap</span>
                    </span>
                  )}

                  <span className="font-semibold text-base text-ink truncate">{item.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-paper-2 text-muted border border-rule shrink-0">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {hasEvidence && (
                    <button
                      type="button"
                      onClick={() =>
                        setInspectEvidence({
                          name: item.name,
                          quote: (item as MatchedSkillItem).evidence,
                          category: item.category,
                        })
                      }
                      className="min-h-[40px] inline-flex items-center gap-2 text-xs font-semibold text-violet hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg px-3.5 py-2 bg-violet-soft border border-violet/30 hover:bg-violet-soft/80 transition-colors press-scale"
                    >
                      <FileSearch className="h-4 w-4" aria-hidden="true" />
                      <span>Inspect evidence</span>
                    </button>
                  )}
                  {type === "missing" && (
                    <span className="px-3 py-1.5 rounded-lg text-xs text-accent bg-accent-soft/80 border border-accent/30 font-semibold">
                      Gap to bridge
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Evidence Slide-over Drawer (Permitted Exception g) */}
      {inspectEvidence && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="evidence-heading">
          {/* Dimming Scrim with Click to Dismiss */}
          <div
            className="fixed inset-0 bg-black/80 transition-opacity"
            onClick={() => setInspectEvidence(null)}
          />

          {/* Slide-over Drawer Surface */}
          <div className="relative w-full sm:max-w-lg lg:max-w-xl h-full bg-paper-2 border-l border-rule p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-rule pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-violet" aria-hidden="true" />
                  <span className="text-sm font-semibold text-ink">
                    Verified evidence
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectEvidence(null)}
                  className="rounded-lg p-2 text-ink-2 hover:text-ink hover:bg-paper-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus press-scale cursor-pointer"
                  aria-label="Close evidence drawer"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Skill Chip beside/above title (Permitted Exception g) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-soft text-violet border border-violet/30">
                    {inspectEvidence.category || "Skill Target"}
                  </span>
                  <span className="text-xs text-muted">Document-grounded proof</span>
                </div>
                <h3 id="evidence-heading" className="font-display text-2xl sm:text-3xl font-semibold text-ink">
                  {inspectEvidence.name}
                </h3>
              </div>

              {/* Primary typography quote 18-20px (Permitted Exception g) */}
              <div className="space-y-3">
                <span className="text-xs font-medium text-muted">
                  Extracted context quote
                </span>
                <div className="rounded-xl bg-paper-3 border border-rule p-5 sm:p-6 text-base sm:text-lg text-ink font-display font-medium leading-relaxed border-l-4 border-l-violet shadow-sm">
                  &ldquo;{inspectEvidence.quote}&rdquo;
                </div>
              </div>

              <p className="text-xs sm:text-sm text-ink-2 leading-relaxed bg-paper-3/40 p-4 rounded-xl border border-rule/60">
                This claim was verified to exist verbatim or with 85%+ semantic token alignment in your uploaded PDF.
              </p>
            </div>

            <div className="pt-6 border-t border-rule mt-8">
              <button
                type="button"
                onClick={() => setInspectEvidence(null)}
                className="w-full min-h-[44px] py-3 rounded-xl bg-paper-3 text-ink text-sm font-semibold hover:bg-paper-3/80 transition-colors press-scale cursor-pointer border border-rule"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
