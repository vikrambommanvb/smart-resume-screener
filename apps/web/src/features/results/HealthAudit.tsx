import * as React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Progress } from "../../components/ui";
import { HealthSectionData } from "../../types/api";
import { cn } from "../../lib/utils";

interface HealthAuditProps {
  data: HealthSectionData;
}

export const HealthAudit: React.FC<HealthAuditProps> = ({ data }) => {
  const [severityFilter, setSeverityFilter] = React.useState<"all" | "critical" | "warning" | "tip">("all");

  const subscoreLabels: Record<string, string> = {
    content_strength: "Action Verbs & Impact",
    structure_sections: "Standard Section Headers",
    ats_friendliness: "ATS Parser Friendliness",
    readability_concision: "Bullet Length & Readability",
    consistency: "Tense & Punctuation Consistency",
    contact_links: "Contact Links & Portfolio",
  };

  const subscoreExplanations: Record<string, string> = {
    content_strength: "Evaluates active verb momentum and measurable results.",
    structure_sections: "Checks for standard headings that ATS parsers anticipate.",
    ats_friendliness: "Verifies clean machine-readable syntax and formatting.",
    readability_concision: "Audits word density, scannability, and bullet length.",
    consistency: "Verifies past vs present tense harmony and punctuation.",
    contact_links: "Ensures phone, email, and portfolio links are detectable.",
  };

  const filteredFindings = (data.findings || []).filter((f) => {
    if (severityFilter === "all") return true;
    if (severityFilter === "critical") return f.severity === "critical" || f.severity === ("fix" as unknown);
    if (severityFilter === "warning") return f.severity === "warning";
    if (severityFilter === "tip") return f.severity === "tip" || f.severity === ("consider" as unknown);
    return f.severity === severityFilter;
  });

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "fix":
        return <AlertTriangle className="h-5 w-5 text-bad shrink-0" aria-hidden="true" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />;
      case "tip":
      case "consider":
      default:
        return <Info className="h-5 w-5 text-cool shrink-0" aria-hidden="true" />;
    }
  };

  const severityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "critical":
      case "fix":
        return "critical" as const;
      case "warning":
        return "warning" as const;
      case "tip":
      case "consider":
      default:
        return "info" as const;
    }
  };

  const severityCardStyles = (severity: string) => {
    switch (severity) {
      case "critical":
      case "fix":
        return "border-bad/30 bg-bad-soft/10 hover:border-bad/50";
      case "warning":
        return "border-accent/30 bg-accent-soft/10 hover:border-accent/50";
      case "tip":
      case "consider":
      default:
        return "border-cool/30 bg-cool-soft/10 hover:border-cool/50";
    }
  };

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-sm">
      <CardHeader className="p-6 sm:p-8 pb-6 border-b border-rule/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Resume health</CardTitle>
            <p className="text-sm text-ink-2 leading-relaxed">
              Structural issues and formatting that might trip an applicant tracking system.
            </p>
          </div>
          <Badge variant={data.total_score >= 80 ? "success" : "warning"} className="text-xs px-3 py-1 font-semibold self-start sm:self-center">
            {data.total_score >= 80 ? "ATS Optimized" : "Needs Polish"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 lg:p-10 space-y-10">
        {/* Prominent Overall Health Hero Module */}
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-3/40 border border-rule/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs text-muted font-medium block">Overall ATS Health Score</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-outlier text-5xl sm:text-6xl font-medium text-ink tabular-nums">
                {data.total_score}
              </span>
              <span className="text-sm text-muted font-normal font-outlier">/ 100</span>
            </div>
          </div>
          <p className="text-sm text-ink-2 leading-relaxed max-w-lg">
            This deterministic audit measures machine-readability across 6 structural dimensions, identifying syntax obstacles that could lead to parsing dropouts.
          </p>
        </div>

        {/* 6-Dimension Metric Grid */}
        <div className="space-y-4">
          <div className="space-y-1 pb-1 border-b border-rule/60">
            <h3 className="text-base sm:text-lg text-ink font-semibold">
              Structural dimensions
            </h3>
            <p className="text-xs text-muted">Baseline evaluation across content strength, syntax, and section formatting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.subscores || {}).map(([key, item]) => {
              const pct = Math.round((item.score / item.max) * 100);
              return (
                <div key={key} className="p-5 rounded-2xl bg-paper-3/40 border border-rule/70 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="font-semibold text-ink">{subscoreLabels[key] || key}</span>
                      <span className="font-outlier text-accent tabular-nums font-semibold shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <span className="font-outlier text-xs text-muted tabular-nums block font-medium">
                      {item.score} of {item.max} pts
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Progress value={pct} variant={pct >= 80 ? "success" : pct >= 50 ? "default" : "warning"} className="h-2.5" />
                    <p className="text-xs text-muted leading-relaxed pt-1">
                      {subscoreExplanations[key] || "Component audit score."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Findings Section */}
        <div className="space-y-5 pt-4 border-t border-rule/80">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-rule/60">
            <div className="space-y-1">
              <h3 className="font-display text-base sm:text-lg font-semibold text-ink">
                Audited findings (<span className="font-outlier">{data.findings?.length || 0}</span>)
              </h3>
              <p className="text-xs text-muted">Actionable suggestions to improve machine-parsing fidelity.</p>
            </div>

            {/* Severity Filter */}
            <div className="flex rounded-xl bg-paper-3 p-1 border border-rule text-xs sm:text-sm font-medium">
              <button
                type="button"
                onClick={() => setSeverityFilter("all")}
                className={`min-h-[38px] px-3.5 py-1 rounded-lg cursor-pointer transition-colors press-scale ${
                  severityFilter === "all" ? "bg-paper-2 text-ink font-semibold border border-rule/60 shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter("critical")}
                className={`min-h-[38px] px-3.5 py-1 rounded-lg cursor-pointer transition-colors press-scale ${
                  severityFilter === "critical" ? "bg-paper-2 text-bad font-semibold border border-bad/30 shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                Critical
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter("warning")}
                className={`min-h-[38px] px-3.5 py-1 rounded-lg cursor-pointer transition-colors press-scale ${
                  severityFilter === "warning" ? "bg-paper-2 text-accent font-semibold border border-accent/30 shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                Warnings
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter("tip")}
                className={`min-h-[38px] px-3.5 py-1 rounded-lg cursor-pointer transition-colors press-scale ${
                  severityFilter === "tip" ? "bg-paper-2 text-cool font-semibold border border-cool/30 shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                Tips
              </button>
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="flex items-center gap-3 p-5 text-sm text-ok bg-ok-soft border border-ok/30 rounded-2xl">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>No issues detected in this category. Great job!</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl border p-5 sm:p-6 text-sm transition-colors space-y-2 flex-col sm:flex-row sm:space-y-0",
                    severityCardStyles(finding.severity)
                  )}
                >
                  <span className="mt-0.5 shrink-0">{severityIcon(finding.severity)}</span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Badge variant={severityBadgeVariant(finding.severity)} size="sm" className="font-semibold capitalize">
                        {finding.severity}
                      </Badge>
                      {finding.location && (
                        <span className="text-xs text-muted font-medium bg-paper-2 px-2.5 py-0.5 rounded-md border border-rule">
                          {finding.location}
                        </span>
                      )}
                    </div>
                    <p className="text-ink font-normal leading-relaxed text-sm sm:text-base">{finding.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
