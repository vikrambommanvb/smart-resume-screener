import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
  Shield,
  Layers,
  Compass,
  BookOpen,
  MessageSquareCode,
  Target,
} from "lucide-react";
import { Badge, Button } from "../../components/ui";
import { streamAnalyzeResume } from "../../lib/api-client";
import { AlternativeCareers } from "../results/AlternativeCareers";
import { BulletRewrites } from "../results/BulletRewrites";
import { ConstellationContainer } from "../constellation/ConstellationContainer";
import { ConstellationSVG } from "../constellation/ConstellationSVG";
import { HealthAudit } from "../results/HealthAudit";
import { InterviewPrep } from "../results/InterviewPrep";
import { RoadmapTimeline } from "../results/RoadmapTimeline";
import { ScoreSummary } from "../results/ScoreSummary";
import { SkillsMatrix } from "../results/SkillsMatrix";
import { Dropzone } from "../upload/Dropzone";
import { TargetJobSelector } from "../upload/TargetJobSelector";
import { AnalysisState, analysisReducer, initialAnalysisState } from "./analysisReducer";
import { STATIC_ROLES } from "../../data/roles";
import { cn } from "../../lib/utils";

// Sample constellation preview data for landing page hero
const sampleLandingSkills = {
  total_count: 10,
  matched: [
    { id: "s1", name: "Python", category: "Languages", importance: "required", evidence: "" },
    { id: "s2", name: "FastAPI", category: "Frameworks", importance: "required", evidence: "" },
    { id: "s3", name: "SQL", category: "Databases", importance: "required", evidence: "" },
    { id: "s4", name: "Git", category: "Tools", importance: "required", evidence: "" },
  ],
  partial: [
    { id: "s5", name: "Docker", category: "DevOps", importance: "required", evidence: "" },
    { id: "s6", name: "Pytest", category: "Testing", importance: "required", evidence: "" },
  ],
  missing: [
    { id: "s7", name: "PostgreSQL", category: "Databases", importance: "required" },
    { id: "s8", name: "Redis", category: "Databases", importance: "preferred" },
    { id: "s9", name: "CI/CD", category: "DevOps", importance: "preferred" },
    { id: "s10", name: "Kubernetes", category: "DevOps", importance: "preferred" },
  ],
};

const REPORT_SECTIONS = [
  { id: "match-estimate", label: "Match estimate", icon: Target },
  { id: "skill-constellation", label: "Constellation graph", icon: Sparkles },
  { id: "skills-matrix", label: "Required skills", icon: Layers },
  { id: "resume-health", label: "Resume health", icon: Shield },
  { id: "bullet-improvements", label: "Bullet improvements", icon: FileText },
  { id: "learning-roadmap", label: "Learning roadmap", icon: BookOpen },
  { id: "alternative-careers", label: "Career pathways", icon: Compass },
  { id: "interview-prep", label: "Interview prep", icon: MessageSquareCode },
];

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class DashboardErrorBoundary extends React.Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || "An unexpected rendering error occurred." };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Dashboard caught rendering error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-paper-2 border border-rule text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent-soft text-accent">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="font-display text-xl font-medium text-ink">Unable to render report dashboard</h3>
          <p className="text-sm text-ink-2 leading-relaxed">
            {this.state.errorMessage}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
            className="min-h-[40px] px-5 text-sm rounded-xl press-scale"
          >
            Retry display
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface AnalysisDashboardProps {
  initialState?: AnalysisState;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  initialState = initialAnalysisState,
}) => {
  const [state, dispatch] = React.useReducer(analysisReducer, initialState);
  const [file, setFile] = React.useState<File | null>(null);
  const [mode, setMode] = React.useState<"role" | "custom">("role");
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("python_developer");
  const [customJd, setCustomJd] = React.useState<string>("");
  const [activeSection, setActiveSection] = React.useState<string>("match-estimate");
  const [waitingSeconds, setWaitingSeconds] = React.useState<number>(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const resultsHeadingRef = React.useRef<HTMLHeadingElement | null>(null);

  const isFormValid =
    Boolean(file) && (mode === "role" ? Boolean(selectedRoleId) : customJd.trim().length >= 250);

  const handleStartAnalysis = async () => {
    if (!file || !isFormValid) return;

    dispatch({ type: "START_STREAM" });
    abortControllerRef.current = new AbortController();

    try {
      await streamAnalyzeResume({
        file,
        mode,
        roleId: mode === "role" ? selectedRoleId : undefined,
        customJd: mode === "custom" ? customJd : undefined,
        signal: abortControllerRef.current.signal,
        callbacks: {
          onStage: (stage) => dispatch({ type: "UPDATE_STAGE", payload: stage }),
          onSection: (name, data) => dispatch({ type: "UPDATE_SECTION", payload: { name, data } }),
          onDone: (done) => {
            dispatch({
              type: "STREAM_DONE",
              payload: {
                degraded: done.degraded,
                requestId: done.request_id,
                durationMs: done.duration_ms,
              },
            });
            setTimeout(() => {
              resultsHeadingRef.current?.focus();
            }, 100);
          },
          onError: (err) =>
            dispatch({
              type: "STREAM_ERROR",
              payload: { section: err.section, message: err.message, code: err.code },
            }),
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      let errorMsg = err instanceof Error ? err.message : "Failed to analyze resume.";
      if (errorMsg === "Load failed" || errorMsg.includes("Failed to fetch")) {
        errorMsg = "Unable to connect to analysis service. Please retry in a moment.";
      }
      dispatch({
        type: "STREAM_ERROR",
        payload: {
          section: null,
          message: errorMsg,
          code: "STREAM_ERROR",
        },
      });
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    dispatch({ type: "RESET" });
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    dispatch({ type: "RESET" });
    setFile(null);
    setCustomJd("");
  };

  const handleClearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const handlePrint = () => {
    window.print();
  };

  const isStreaming = state.status === "streaming";
  const hasResults = Boolean(state.match || state.health || state.skills);

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isStreaming) {
      setWaitingSeconds(0);
      timer = setInterval(() => {
        setWaitingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setWaitingSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStreaming]);

  React.useEffect(() => {
    if (!hasResults || typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -50% 0px",
        threshold: [0, 0.25],
      }
    );

    REPORT_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [hasResults]);

  const getProcessingMessage = () => {
    if (state.stages.guidance?.status === "running") return "Synthesising insights and learning roadmap";
    if (state.stages.health?.status === "running") return "Auditing resume structure and ATS health";
    if (state.stages.match?.status === "running") return "Matching against required skills";
    if (state.stages.understand?.status === "running") return "Parsing sections and extracting skills";
    if (state.stages.read?.status === "running") return "Reading your resume";
    if (waitingSeconds >= 3) return "Connecting to analysis engine...";
    return "Reading your resume";
  };

  return (
    <div className="space-y-12">
      {/* Global Error Banner (Positioned prominently at top) */}
      {state.globalError && (
        <div className="rounded-[10px] border border-bad/50 bg-bad-soft p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-bad">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-bad shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-medium text-sm text-bad">Analysis failed</p>
              <p className="leading-relaxed text-bad/90">{state.globalError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button size="sm" variant="secondary" onClick={handleClearError}>
              Clear error
            </Button>
            {isFormValid && (
              <Button size="sm" variant="primary" onClick={handleStartAnalysis} disabled={isStreaming}>
                Retry
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleReset}>
              Reset all
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. LANDING & WORKBENCH (Shown before analysis) */}
      {/* ============================================================== */}
      {!hasResults && !isStreaming && (
        <div className="space-y-16">
          {/* Hero Section: Live Dropzone beside 2D Constellation Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Dropzone & Target Role Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-1">
                <h2 className="font-display text-xl sm:text-2xl font-medium tracking-tight text-ink">
                  Target job and candidate resume
                </h2>
                <p className="text-ink-2 text-sm leading-relaxed max-w-xl">
                  Upload a PDF up to 5 MB and select from 14 verified roles or paste a custom description.
                </p>
              </div>

              {/* Upload Dropzone */}
              <Dropzone file={file} onFileSelect={setFile} disabled={isStreaming} />

              {/* Target Selector */}
              <TargetJobSelector
                mode={mode}
                onModeChange={setMode}
                selectedRoleId={selectedRoleId}
                onRoleSelect={setSelectedRoleId}
                customJd={customJd}
                onCustomJdChange={setCustomJd}
                disabled={isStreaming}
              />

              {/* Primary Action Button (Desktop inline) */}
              <div className="pt-2 hidden lg:block">
                <Button
                  size="lg"
                  variant="primary"
                  disabled={!isFormValid || isStreaming}
                  onClick={handleStartAnalysis}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  className="w-full min-h-[56px] text-base sm:text-lg font-semibold py-4 rounded-xl shadow-lg shadow-accent/15 press-scale"
                >
                  Analyse resume
                </Button>
                {!file && (
                  <p className="text-xs text-muted text-center mt-2.5 font-medium">
                    Select a PDF resume to begin alignment analysis.
                  </p>
                )}
                {file && mode === "custom" && customJd.trim().length < 250 && (
                  <p className="text-xs text-accent text-center mt-2.5 font-medium">
                    Paste at least 250 characters of the job description.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Constellation Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule/80 pb-3">
                <span className="text-sm text-ink-2 flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-violet" aria-hidden="true" />
                  <span>Alignment constellation preview</span>
                </span>
                <span className="text-xs text-muted font-medium bg-paper-3 px-2 py-0.5 rounded border border-rule">Sample projection</span>
              </div>

              <div className="relative rounded-2xl bg-paper-2 border border-rule/80 p-4 sm:p-5 overflow-hidden shadow-sm">
                <ConstellationSVG skills={sampleLandingSkills} />
                <div className="p-3.5 text-center border-t border-rule/50 mt-2">
                  <p className="text-xs text-ink-2 leading-relaxed">
                    Verified competencies in <span className="text-violet font-semibold">violet</span>, partial matches in <span className="text-cool font-semibold">blue</span>, and gaps in <span className="text-accent font-semibold">amber</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sticky Action Bar */}
          {file && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-paper-2 border-t border-rule z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg">
              <Button
                size="lg"
                variant="primary"
                disabled={!isFormValid || isStreaming}
                onClick={handleStartAnalysis}
                className="w-full min-h-[56px] text-base font-semibold py-4 rounded-xl shadow-lg shadow-accent/20 press-scale"
              >
                Analyse resume
              </Button>
            </div>
          )}

          {/* ============================================================== */}
          {/* Below The Fold: Score composition & 14-Role Index */}
          {/* ============================================================== */}
          <div className="pt-10 border-t border-rule space-y-12">
            {/* Horizontal Score Composition Bar */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-medium text-ink">Score composition</h3>
                <p className="text-sm text-ink-2 max-w-2xl leading-relaxed">
                  Deterministic alignment against the target role. Calculated with strict mathematical weights.
                </p>
              </div>

              {/* Composition Bar */}
              <div className="rounded-2xl bg-paper-2 border border-rule/80 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="h-4 w-full rounded-full overflow-hidden flex bg-paper-3 border border-rule/80">
                  <div className="bg-violet h-full" style={{ width: "40%" }} title="Required skills: 40%" />
                  <div className="bg-cool h-full" style={{ width: "25%" }} title="Responsibilities: 25%" />
                  <div className="bg-cool/80 h-full" style={{ width: "15%" }} title="Experience depth: 15%" />
                  <div className="bg-violet/80 h-full" style={{ width: "15%" }} title="Projects: 15%" />
                  <div className="bg-accent h-full" style={{ width: "5%" }} title="Education: 5%" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-paper-3/40 border border-rule/50 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-ink text-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-violet" aria-hidden="true" />
                      <span>Skills (40%)</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">Core required proficiencies</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-paper-3/40 border border-rule/50 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-ink text-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-cool" aria-hidden="true" />
                      <span>Responsibilities (25%)</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">Architectural ownership</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-paper-3/40 border border-rule/50 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-ink text-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-cool/80" aria-hidden="true" />
                      <span>Experience (15%)</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">Documented baseline years</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-paper-3/40 border border-rule/50 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-ink text-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-violet/80" aria-hidden="true" />
                      <span>Projects (15%)</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">Production deliverables</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-paper-3/40 border border-rule/50 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-ink text-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                      <span>Education (5%)</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">Degrees and credentials</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permitted Exception b: Replace spec sheet with real 14-role usable index */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-display text-2xl font-medium text-ink">Benchmark role catalog</h3>
                  <p className="text-sm text-ink-2 max-w-2xl leading-relaxed">
                    Select any of the 14 verified roles to load its benchmark criteria into your active screening target.
                  </p>
                </div>
                <span className="text-xs text-muted bg-paper-3 px-3 py-1 rounded-md border border-rule font-medium">
                  14 curated profiles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {STATIC_ROLES.map((role) => {
                  const isSelected = mode === "role" && selectedRoleId === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setMode("role");
                        setSelectedRoleId(role.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "rounded-2xl p-5 text-left border transition-colors duration-200 flex flex-col justify-between space-y-3 cursor-pointer press-scale shadow-sm",
                        isSelected
                          ? "bg-violet-soft/10 border-violet ring-1 ring-violet"
                          : "bg-paper-2 border-rule/80 hover:border-rule-2 hover:bg-paper-3/50"
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display font-semibold text-base text-ink">{role.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded bg-paper-3 text-muted border border-rule font-medium">
                            {role.seniority_default || "Mid"}
                          </span>
                        </div>
                        <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
                          {role.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-rule/50 flex flex-wrap gap-1">
                        {role.core_skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded bg-paper-3 text-ink-2 border border-rule"
                          >
                            {skill.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy Architecture Guarantee: 4 Clean Sentences */}
            <div className="rounded-2xl bg-paper-2 border border-rule/80 p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-violet" aria-hidden="true" />
                <h4 className="font-display text-lg font-semibold text-ink">Privacy by construction</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-sm text-ink-2 leading-relaxed">
                <p>
                  Your resume is processed strictly in temporary volatile memory and never saved to a disk or persistent database.
                </p>
                <p>
                  All personal identifiable information (name, phone number, email, and addresses) is redacted before any analysis occurs.
                </p>
                <p>
                  We do not use user accounts, passwords, third-party analytics trackers, or advertising telemetry cookies.
                </p>
                <p>
                  Scoring logic is 100% deterministic, open, and mathematically reproducible from the same inputs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PROCESSING STREAM VIEW (Single centered status line) */}
      {/* ============================================================== */}
      {isStreaming && (
        <div className="max-w-2xl mx-auto py-16 space-y-8 text-center animate-in fade-in-50 duration-300">
          {/* Single Centered Status Line in Display Typeface */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-violet-soft border border-violet/40 text-violet mb-2">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink">
              {getProcessingMessage()}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs sm:text-sm text-ink-2">
              {waitingSeconds >= 3 && state.stages.read?.status !== "running" && state.stages.read?.status !== "done" ? (
                <span className="text-violet font-medium animate-pulse">
                  Waking up analysis service (takes ~25s if asleep)...
                </span>
              ) : (
                <>
                  <span>In-memory streaming pipeline active</span>
                  <span className="h-3 w-px bg-rule" aria-hidden="true" />
                  <span>Zero disk footprint</span>
                </>
              )}
            </div>
          </div>

          {/* Vertical Pipeline Stage List */}
          <div className="rounded-2xl bg-paper-2 border border-rule/80 p-6 text-left divide-y divide-rule/60 shadow-lg">
            {Object.values(state.stages).map((stage) => {
              const isDone = stage.status === "done";
              const isRunning = stage.status === "running";
              return (
                <div key={stage.id} className="py-3.5 flex items-center justify-between text-sm first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3.5">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-ok shrink-0" aria-hidden="true" />
                    ) : isRunning ? (
                      <div className="h-5 w-5 rounded-full border-2 border-violet border-t-transparent animate-spin shrink-0" aria-hidden="true" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-rule shrink-0" aria-hidden="true" />
                    )}
                    <span
                      className={cn(
                        "font-medium transition-colors",
                        isDone ? "text-ink" : isRunning ? "text-violet font-semibold" : "text-muted"
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted font-medium">
                    {isDone ? "Done" : isRunning ? "In progress" : "Queued"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Visible Cancel Action */}
          <div>
            <Button size="sm" variant="outline" onClick={handleCancel} className="min-h-[40px] px-5 text-sm press-scale rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Degraded Mode Banner */}
      {state.degraded && (
        <div className="rounded-2xl border border-accent/40 bg-accent-soft p-5 flex items-center justify-between text-sm text-accent shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
            <span>
              <strong>AI sections unavailable:</strong> Core deterministic score, skill gaps, health audit, and curated roadmap are fully calculated.
            </span>
          </div>
          <Badge variant="warning" size="sm" className="font-semibold">
            Deterministic Engine
          </Badge>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. RESULTS DASHBOARD (Desktop Sticky Rail & Mobile Bottom Nav) */}
      {/* ============================================================== */}
      {hasResults && !isStreaming && (
        <DashboardErrorBoundary>
          <div className="space-y-10 animate-in fade-in-50 duration-500">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-rule/80 pb-6">
            <div className="space-y-2">
              <h2
                ref={resultsHeadingRef}
                id="results-heading"
                tabIndex={-1}
                className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink outline-none"
              >
                Analysis report
              </h2>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-ink-2">
                <span className="bg-paper-2 px-2.5 py-1 rounded-md border border-rule">
                  Session <span className="font-outlier font-mono text-ink">{state.requestId || "sample-audit"}</span>
                </span>
                <span className="bg-paper-2 px-2.5 py-1 rounded-md border border-rule">
                  Elapsed <span className="font-outlier font-mono text-ink">{state.durationMs ? `${state.durationMs}ms` : "< 1s"}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" leftIcon={<Printer className="h-4 w-4" aria-hidden="true" />} onClick={handlePrint} className="min-h-[44px] px-5 rounded-xl text-sm font-semibold press-scale">
                Print report
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />} onClick={handleReset} className="min-h-[44px] px-5 rounded-xl text-sm font-semibold press-scale">
                Try another resume
              </Button>
            </div>
          </div>

          {/* Mobile / Tablet Horizontal Section Jump Bar */}
          <nav
            aria-label="Report section navigation"
            className="lg:hidden sticky top-[65px] z-30 -mx-6 px-6 py-2.5 bg-paper-2 border-b border-rule flex items-center gap-2 overflow-x-auto shadow-sm"
          >
            {REPORT_SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={cn(
                    "whitespace-nowrap min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5",
                    isActive
                      ? "bg-violet-soft text-violet border border-violet/40 font-semibold"
                      : "bg-paper-3/60 text-ink-2 hover:text-ink border border-rule/70"
                  )}
                >
                  <span>{sec.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Desktop Layout: Sticky Navigation Rail beside Dominant Column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Sticky Rail (Desktop) */}
            <nav
              aria-label="Report sections"
              className="hidden lg:block lg:col-span-3 sticky top-24 space-y-1.5 p-4 rounded-2xl bg-paper-2 border border-rule/80 shadow-md shadow-black/20 text-sm"
            >
              <span className="text-xs font-medium text-muted px-3 py-2 block">
                Report sections
              </span>
              {REPORT_SECTIONS.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150",
                      isActive
                        ? "bg-violet-soft text-violet border border-violet/30 font-semibold shadow-sm"
                        : "text-ink-2 hover:text-ink hover:bg-paper-3/80 font-medium"
                    )}
                  >
                    <IconComponent className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{sec.label}</span>
                  </a>
                );
              })}
            </nav>

            {/* Dominant Content Column (9 Cols Desktop) */}
            <div className="lg:col-span-9 space-y-12">
              <div id="match-estimate" className="scroll-mt-24">
                {state.match && <ScoreSummary data={state.match} />}
              </div>

              <div id="skill-constellation" className="scroll-mt-24">
                {state.skills && <ConstellationContainer skills={state.skills} />}
              </div>

              <div id="skills-matrix" className="scroll-mt-24">
                {state.skills && <SkillsMatrix data={state.skills} />}
              </div>

              <div id="resume-health" className="scroll-mt-24">
                {state.health && <HealthAudit data={state.health} />}
              </div>

              <div id="bullet-improvements" className="scroll-mt-24">
                {state.improvements && state.improvements.length > 0 && (
                  <BulletRewrites rewrites={state.improvements} />
                )}
              </div>

              <div id="learning-roadmap" className="scroll-mt-24">
                {state.roadmap && state.roadmap.length > 0 && (
                  <RoadmapTimeline steps={state.roadmap} />
                )}
              </div>

              <div id="alternative-careers" className="scroll-mt-24">
                {state.careers && state.careers.length > 0 && (
                  <AlternativeCareers careers={state.careers} />
                )}
              </div>

              <div id="interview-prep" className="scroll-mt-24">
                {state.interview && state.interview.length > 0 && (
                  <InterviewPrep questions={state.interview} />
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardErrorBoundary>
      )}
    </div>
  );
};
