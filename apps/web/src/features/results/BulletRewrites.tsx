import * as React from "react";
import { Check, Copy, Sparkles, Edit3 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { RewriteItem } from "../../types/api";

interface BulletRewritesProps {
  rewrites: RewriteItem[];
}

export const BulletRewrites: React.FC<BulletRewritesProps> = ({ rewrites }) => {
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);
  const [placeholderValues, setPlaceholderValues] = React.useState<Record<string, string>>({});

  const handlePlaceholderChange = (idx: number, placeholder: string, val: string) => {
    setPlaceholderValues((prev) => ({
      ...prev,
      [`${idx}-${placeholder}`]: val,
    }));
  };

  const getFinalizedText = (item: RewriteItem, idx: number) => {
    let text = item.suggested;
    (item.placeholders || []).forEach((ph) => {
      const userVal = placeholderValues[`${idx}-${ph}`];
      if (userVal && userVal.trim()) {
        text = text.replaceAll(ph, userVal.trim());
      }
    });
    return text;
  };

  const handleCopy = (item: RewriteItem, idx: number) => {
    const textToCopy = getFinalizedText(item, idx);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  // Helper to render bracketed placeholders styled as readable inline fields (Permitted Exception h)
  const renderHighlightedSuggested = (text: string) => {
    // Splits text into chunks, matching bracketed tokens like [X]% or [X]
    const regex = /(\[[^\]]+\](?:%|\b)?)/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-accent-soft text-accent border border-accent/40 font-mono text-xs font-semibold shadow-xs"
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  if (!rewrites || rewrites.length === 0) {
    return (
      <Card className="bg-paper-2 border border-rule/80">
        <CardContent className="p-8 sm:p-12 text-center text-ink-2 text-sm sm:text-base">
          No bullet rewrite suggestions available for this profile.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-lg shadow-black/10">
      <CardHeader className="p-6 sm:p-8 pb-5 border-b border-rule/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Bullet improvements</CardTitle>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
              Clearer action verbs and quantifiable results. Fill in bracketed values with your real metrics.
            </p>
          </div>
          <Badge variant="brand" className="text-xs px-3 py-1 font-semibold">Grounded in verified experience</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-8">
        {rewrites.map((item, idx) => {
          const unfilledCount = (item.placeholders || []).filter(
            (ph) => !placeholderValues[`${idx}-${ph}`]?.trim()
          ).length;

          const finalizedText = getFinalizedText(item, idx);

          return (
            <div
              key={idx}
              className="rounded-2xl bg-paper-3/40 p-5 sm:p-6 space-y-5 border border-rule/80"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule/60 pb-3">
                <span className="text-sm font-semibold text-ink-2">
                  {item.section}
                </span>

                <div className="flex items-center gap-3">
                  {unfilledCount > 0 && (
                    <span className="text-xs text-accent bg-accent-soft px-2.5 py-1 rounded-md border border-accent/30 font-semibold">
                      {unfilledCount} placeholder{unfilledCount > 1 ? "s" : ""} to fill
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={copiedIdx === idx ? "secondary" : "primary"}
                    leftIcon={
                      copiedIdx === idx ? (
                        <Check className="h-4 w-4 text-ok" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )
                    }
                    onClick={() => handleCopy(item, idx)}
                    className="min-h-[40px] px-4 text-xs sm:text-sm font-semibold press-scale"
                  >
                    {copiedIdx === idx ? "Copied" : "Copy suggestion"}
                  </Button>
                </div>
              </div>

              {/* Side-by-side on desktop, stacked on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-sm">
                {/* Original */}
                <div className="space-y-2.5 rounded-xl bg-paper-2 p-4 sm:p-5 border border-rule/70">
                  <span className="text-xs text-muted font-medium">
                    Original resume bullet
                  </span>
                  <p className="text-ink-2 leading-relaxed line-through decoration-rule-2 font-normal text-sm sm:text-base">
                    {item.original}
                  </p>
                </div>

                {/* Suggested with styled bracketed placeholders (Permitted Exception h) */}
                <div className="space-y-2.5 rounded-xl bg-paper-2 p-4 sm:p-5 border border-violet/40 shadow-sm">
                  <span className="text-xs text-violet font-medium flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Suggested improvement</span>
                  </span>
                  <p className="text-ink font-medium leading-relaxed text-sm sm:text-base">
                    {renderHighlightedSuggested(finalizedText)}
                  </p>
                </div>
              </div>

              {/* Inline Interactive Placeholder Inputs */}
              {item.placeholders && item.placeholders.length > 0 && (
                <div className="rounded-xl bg-paper-2/90 p-4 sm:p-5 border border-rule/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-ink-2">
                    <Edit3 className="h-4 w-4 text-accent" aria-hidden="true" />
                    <span>Fill in your genuine metrics:</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {item.placeholders.map((ph) => {
                      const inputKey = `${idx}-${ph}`;
                      const currentVal = placeholderValues[inputKey] || "";
                      return (
                        <div key={ph} className="flex items-center gap-2">
                          <label htmlFor={`input-${inputKey}`} className="text-xs font-mono text-muted font-medium">
                            {ph}:
                          </label>
                          <input
                            id={`input-${inputKey}`}
                            type="text"
                            value={currentVal}
                            onChange={(e) => handlePlaceholderChange(idx, ph, e.target.value)}
                            placeholder="e.g. 35% or $12,000"
                            className="h-10 px-3.5 text-xs sm:text-sm rounded-lg bg-paper-3 border border-rule text-ink placeholder:text-muted focus:outline-none focus:border-accent w-44"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {item.rationale && (
                <p className="text-xs sm:text-sm text-muted pl-1">
                  Rationale: {item.rationale}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
