import * as React from "react";
import { Compass, Sparkles } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { CareerAlternative } from "../../types/api";

interface AlternativeCareersProps {
  careers: CareerAlternative[];
}

const formatLabel = (str?: string): string => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const AlternativeCareers: React.FC<AlternativeCareersProps> = ({ careers }) => {
  if (!careers || careers.length === 0) return null;

  const fitBadgeVariant = (band: CareerAlternative["fit_band"]) => {
    switch (band) {
      case "Strong fit":
        return "brand";
      case "Good fit":
        return "info";
      case "Possible fit":
      default:
        return "neutral";
    }
  };

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-lg shadow-black/10">
      <CardHeader className="p-6 sm:p-8 pb-5 border-b border-rule/80">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Alternative career pathways</CardTitle>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
              Roles in our catalog that strongly align with your verified skillset.
            </p>
          </div>
          <Compass className="h-6 w-6 text-violet shrink-0" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {careers.map((career) => (
            <div
              key={career.role_id}
              className="flex flex-col justify-between rounded-2xl bg-paper-3/40 p-6 space-y-5 border border-rule/80 hover:border-rule-2 transition-colors shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-lg font-semibold text-ink">{career.title}</h4>
                  <Badge variant={fitBadgeVariant(career.fit_band)} size="sm" className="px-2.5 py-1 text-xs font-semibold">
                    {career.fit_band}
                  </Badge>
                </div>
                <p className="text-sm text-ink-2 leading-relaxed">{career.summary}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-rule/60 text-xs sm:text-sm">
                {/* Shared skills */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-violet flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Matched strengths</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(career.matched_skills || []).slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-violet-soft text-violet border border-violet/30"
                      >
                        {formatLabel(s)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gaps to close */}
                {career.gaps_to_close && career.gaps_to_close.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-accent">Gaps to bridge</span>
                    <div className="flex flex-wrap gap-1.5">
                      {career.gaps_to_close.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-accent-soft text-accent border border-accent/30"
                        >
                          {formatLabel(g)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
