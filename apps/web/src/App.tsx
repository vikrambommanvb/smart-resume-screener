import React, { Suspense } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AnalysisDashboard } from "./features/analysis/AnalysisDashboard";
import { mockCompletedAnalysisState } from "./features/analysis/mockData";

const PrivacyPage = React.lazy(() =>
  import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage }))
);
const NotFoundPage = React.lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

interface MainLayoutProps {
  defaultState?: "idle" | "completed";
}

const MainLayout: React.FC<MainLayoutProps> = ({ defaultState = "idle" }) => {
  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink selection:bg-accent/25">
      {/* Edge-aligned Masthead Nav */}
      <header className="sticky top-0 z-40 bg-paper-2 border-b border-rule px-6 sm:px-10 lg:px-16 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded px-2 py-1 press-scale"
        >
          <span className="font-display font-medium text-lg tracking-tight text-ink">
            Smart Resume Screener
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-2">
          <Link
            to="/privacy"
            className="hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded px-2 py-1"
          >
            Privacy
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 sm:px-10 lg:px-16 py-10 md:py-16">
        <div className="mb-12 lg:mb-16 space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-ink leading-[1.08]">
            Check your resume against one role
          </h1>
          <p className="lead text-ink-2 text-base sm:text-lg max-w-2xl leading-relaxed">
            A deterministic match score, verified evidence quotes, and a step-by-step roadmap.
          </p>
        </div>

        <AnalysisDashboard
          initialState={defaultState === "completed" ? mockCompletedAnalysisState : undefined}
        />
      </main>

      {/* Monolithic Footer with Hairlines */}
      <footer className="border-t border-rule px-6 sm:px-10 lg:px-16 py-12 text-xs text-muted">
        <div className="max-w-[1500px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-ink">Smart Resume Screener</span>
            <span className="h-3 w-px bg-rule" aria-hidden="true" />
            <span>Zero data retention by construction</span>
            <span className="h-3 w-px bg-rule" aria-hidden="true" />
            <span>Deterministic scoring engine</span>
          </div>
          <div className="text-muted">
            Catalog verified Nov 2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-paper text-ink" />}>
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/results" element={<MainLayout defaultState="completed" />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  );
};

export default App;
