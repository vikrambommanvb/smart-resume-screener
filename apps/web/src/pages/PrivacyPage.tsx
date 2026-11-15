import React from "react";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck, Database, EyeOff, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui";

export const PrivacyPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-paper text-ink p-6 sm:p-10 md:p-16 space-y-14 max-w-5xl mx-auto">
      {/* Return Navigation */}
      <nav aria-label="Breadcrumb">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg px-3.5 py-2 press-scale font-medium bg-paper-2 border border-rule/80 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Return to screener</span>
        </Link>
      </nav>

      {/* 1. Privacy Overview */}
      <header className="space-y-4 border-b border-rule/80 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="brand" className="text-xs px-3 py-1 font-semibold">Privacy architecture</Badge>
          <span className="text-xs text-muted font-medium bg-paper-2 px-2.5 py-0.5 rounded-md border border-rule font-outlier">
            0 KB persistent footprint
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-ink leading-[1.12]">
          Privacy and data protection architecture
        </h1>
        <p className="text-ink-2 text-base sm:text-lg leading-relaxed max-w-3xl">
          Privacy is engineered directly into our execution flow through strict zero retention.
        </p>
      </header>

      {/* 2. Document Processing Lifecycle */}
      <section className="space-y-6" aria-labelledby="lifecycle-heading">
        <div className="space-y-1">
          <h2 id="lifecycle-heading" className="font-display text-2xl font-medium text-ink">
            Document processing lifecycle
          </h2>
          <p className="text-sm text-ink-2">
            Every uploaded resume follows an ephemeral, unidirectional lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-paper-2 border border-rule/80 space-y-3">
            <span className="font-outlier font-semibold text-xs text-violet px-2 py-0.5 rounded bg-violet-soft border border-violet/30">
              Stage 1
            </span>
            <h3 className="font-display text-base font-semibold text-ink">In-memory reception</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              PDF bytes stream directly into volatile memory buffers. No temporary files or scratch writes occur on disk.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-paper-2 border border-rule/80 space-y-3">
            <span className="font-outlier font-semibold text-xs text-violet px-2 py-0.5 rounded bg-violet-soft border border-violet/30">
              Stage 2
            </span>
            <h3 className="font-display text-base font-semibold text-ink">PII sanitization</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Names, emails, phone numbers, and street addresses are scrubbed prior to any NLP or model inference.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-paper-2 border border-rule/80 space-y-3">
            <span className="font-outlier font-semibold text-xs text-violet px-2 py-0.5 rounded bg-violet-soft border border-violet/30">
              Stage 3
            </span>
            <h3 className="font-display text-base font-semibold text-ink">Deterministic evaluation</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Scores and ATS health metrics are computed using fixed Python weighting formulas. AI is never used to generate numerical scores.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-paper-2 border border-rule/80 space-y-3">
            <span className="font-outlier font-semibold text-xs text-violet px-2 py-0.5 rounded bg-violet-soft border border-violet/30">
              Stage 4
            </span>
            <h3 className="font-display text-base font-semibold text-ink">Instant memory release</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Upon SSE stream termination or browser disconnect, all memory references are garbage-collected immediately.
            </p>
          </div>
        </div>
      </section>

      {/* 3–6. Architectural Deep-Dive Grid */}
      <section className="space-y-6" aria-labelledby="principles-heading">
        <div className="space-y-1">
          <h2 id="principles-heading" className="font-display text-2xl font-medium text-ink">
            Architecture principles and technical controls
          </h2>
          <p className="text-sm text-ink-2">
            Technical guarantees verified against our open-source codebase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* In-Memory Processing */}
          <div className="rounded-2xl bg-paper-2 border border-rule/80 p-6 sm:p-7 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-3 text-violet">
              <div className="p-2.5 rounded-xl bg-violet-soft border border-violet/30">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">In-memory execution only</h3>
            </div>
            <div className="text-sm text-ink-2 leading-relaxed space-y-2">
              <p>
                When a PDF is uploaded, the byte stream is processed strictly in temporary volatile memory using PyMuPDF. It is never saved to scratch directories, persistent databases, or object storage.
              </p>
              <p>
                Once the stream finishes or the client disconnects, memory buffers are immediately released and reclaimed by the runtime.
              </p>
            </div>
          </div>

          {/* PII Redaction Architecture */}
          <div className="rounded-2xl bg-paper-2 border border-rule/80 p-6 sm:p-7 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-3 text-violet">
              <div className="p-2.5 rounded-xl bg-violet-soft border border-violet/30">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">PII redaction before LLM inference</h3>
            </div>
            <div className="text-sm text-ink-2 leading-relaxed space-y-2">
              <p>
                Before any text is submitted to Google Gemini Flash, candidate names, contact details, email addresses, phone numbers, and street locations are redacted using regex and spaCy entity recognition.
              </p>
              <p>
                Language models receive only anonymized bullet points and technical skill mentions necessary for synthesis.
              </p>
            </div>
          </div>

          {/* No Trackers or Accounts */}
          <div className="rounded-2xl bg-paper-2 border border-rule/80 p-6 sm:p-7 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-3 text-violet">
              <div className="p-2.5 rounded-xl bg-violet-soft border border-violet/30">
                <Database className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">Zero accounts and zero trackers</h3>
            </div>
            <div className="text-sm text-ink-2 leading-relaxed space-y-2">
              <p>
                We do not require user accounts, passwords, or authentication cookies. We do not store resumes or build persistent candidate profiles.
              </p>
              <p>
                No third-party trackers, analytics scripts, advertising beacons, or telemetry cookies are loaded anywhere in the application.
              </p>
            </div>
          </div>

          {/* Deterministic Evaluation Architecture */}
          <div className="rounded-2xl bg-paper-2 border border-rule/80 p-6 sm:p-7 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-3 text-violet">
              <div className="p-2.5 rounded-xl bg-violet-soft border border-violet/30">
                <Cpu className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">Deterministic evaluation engine</h3>
            </div>
            <div className="text-sm text-ink-2 leading-relaxed space-y-2">
              <p>
                Match scores and health dimensions are calculated deterministically via transparent Python algorithms and exact rubric weights (40/25/15/15/5).
              </p>
              <p>
                Gemini never generates user-facing numbers or health scores, eliminating model hallucinations, prompt injection manipulation, and score drift.
              </p>
            </div>
          </div>
        </div>

        {/* 7. Guaranteed Constraints Checklist */}
        <div className="rounded-2xl bg-paper-3/40 p-6 sm:p-8 space-y-4 border border-rule/80 shadow-sm">
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-violet" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-ink">
              Guaranteed architectural constraints
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-ink-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-ok shrink-0 mt-0.5" aria-hidden="true" />
              <span>Zero bytes written to persistent storage</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-ok shrink-0 mt-0.5" aria-hidden="true" />
              <span>No user credentials, passwords, or session cookies</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-ok shrink-0 mt-0.5" aria-hidden="true" />
              <span>Sanitized PII sent to AI models with evidence quote verification</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-ok shrink-0 mt-0.5" aria-hidden="true" />
              <span>Verified learning catalog with strict HTTP 200 resource links</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPage;
