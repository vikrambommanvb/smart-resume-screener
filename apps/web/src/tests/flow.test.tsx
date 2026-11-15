import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { analysisReducer, initialAnalysisState } from "../features/analysis/analysisReducer";
import { Dropzone } from "../features/upload/Dropzone";
import { TargetJobSelector } from "../features/upload/TargetJobSelector";
import { BulletRewrites } from "../features/results/BulletRewrites";
import { RoadmapTimeline } from "../features/results/RoadmapTimeline";
import { ScoreSummary } from "../features/results/ScoreSummary";
import { MatchSectionData, RoadmapStep } from "../types/api";

describe("Phase 6 Product Flow & Streaming State Tests", () => {
  describe("analysisReducer", () => {
    it("transitions state properly on START_STREAM, UPDATE_STAGE, and UPDATE_SECTION", () => {
      let state = analysisReducer(initialAnalysisState, { type: "START_STREAM" });
      expect(state.status).toBe("streaming");

      state = analysisReducer(state, {
        type: "UPDATE_STAGE",
        payload: { id: "read", label: "Reading PDF", status: "done" },
      });
      expect(state.stages.read.status).toBe("done");

      const mockMatchData: MatchSectionData = {
        total_score: 82,
        band: "strong",
        confidence: "high",
        confidence_note: "Strong match",
        components: {
          skills: { name: "Skills", points: 34, max_points: 40, percentage: 85, explanation: "", is_renormalized: false },
        },
        biggest_movers: [],
      };

      state = analysisReducer(state, {
        type: "UPDATE_SECTION",
        payload: { name: "match", data: mockMatchData },
      });
      expect(state.match?.total_score).toBe(82);

      state = analysisReducer(state, {
        type: "STREAM_DONE",
        payload: { degraded: false, requestId: "req-123", durationMs: 450 },
      });
      expect(state.status).toBe("completed");
      expect(state.requestId).toBe("req-123");
      expect(state.durationMs).toBe(450);
    });

    it("handles section errors and global errors cleanly", () => {
      let state = analysisReducer(initialAnalysisState, {
        type: "STREAM_ERROR",
        payload: { section: "strengths", message: "AI rate limited", code: "AI_ERROR" },
      });
      expect(state.sectionErrors["strengths"]).toBe("AI rate limited");
      expect(state.status).toBe("idle");

      state = analysisReducer(state, {
        type: "STREAM_ERROR",
        payload: { section: null, message: "PDF corrupted", code: "CORRUPT_PDF" },
      });
      expect(state.status).toBe("error");
      expect(state.globalError).toBe("PDF corrupted");
    });
  });

  describe("Dropzone Component", () => {
    it("rejects non-PDF files and enforces 5MB size limit", () => {
      const handleSelect = vi.fn();
      render(<Dropzone file={null} onFileSelect={handleSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // 1. Non-PDF file
      const textFile = new File(["hello world"], "resume.txt", { type: "text/plain" });
      fireEvent.change(fileInput, { target: { files: [textFile] } });
      expect(handleSelect).not.toHaveBeenCalled();
      expect(screen.getByText(/please upload a pdf document/i)).toBeInTheDocument();

      // 2. Oversized PDF (> 5MB)
      const largeFile = new File([new Uint8Array(6 * 1024 * 1024)], "huge.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      expect(handleSelect).not.toHaveBeenCalled();
      expect(screen.getByText(/file exceeds 5mb limit/i)).toBeInTheDocument();

      // 3. Valid PDF
      const validFile = new File([new Uint8Array(1024)], "valid_resume.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      expect(handleSelect).toHaveBeenCalledWith(validFile);
    });
  });

  describe("TargetJobSelector Component", () => {
    it("switches modes and requires at least 50 characters for custom JD", () => {
      const handleModeChange = vi.fn();
      const handleRoleSelect = vi.fn();
      const handleJdChange = vi.fn();

      const { rerender } = render(
        <TargetJobSelector
          mode="role"
          onModeChange={handleModeChange}
          selectedRoleId="python_developer"
          onRoleSelect={handleRoleSelect}
          customJd=""
          onCustomJdChange={handleJdChange}
        />
      );

      const customTab = screen.getByRole("button", { name: /custom job description/i });
      fireEvent.click(customTab);
      expect(handleModeChange).toHaveBeenCalledWith("custom");

      rerender(
        <TargetJobSelector
          mode="custom"
          onModeChange={handleModeChange}
          selectedRoleId="python_developer"
          onRoleSelect={handleRoleSelect}
          customJd="Short text"
          onCustomJdChange={handleJdChange}
        />
      );

      expect(screen.getByText(/please provide at least 50 characters/i)).toBeInTheDocument();
    });
  });

  describe("ScoreSummary & Rewrites Display", () => {
    it("renders circular score and component breakdown", () => {
      const matchData: MatchSectionData = {
        total_score: 85,
        band: "strong",
        confidence: "high",
        confidence_note: "High alignment",
        components: {
          skills: { name: "Skills Match", points: 36, max_points: 40, percentage: 90, explanation: "", is_renormalized: false },
          responsibilities: { name: "Responsibilities", points: 22, max_points: 25, percentage: 88, explanation: "", is_renormalized: false },
        },
        biggest_movers: [{ skill_id: "aws", skill_name: "AWS", category: "cloud", potential_points: 4 }],
      };

      render(<ScoreSummary data={matchData} />);
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText(/strong alignment/i)).toBeInTheDocument();
      expect(screen.getByText("Skills Match")).toBeInTheDocument();
      expect(screen.getByText("+4 pts")).toBeInTheDocument();
    });

    it("renders bullet rewrites with interactive placeholder filling", () => {
      const rewrites = [
        {
          section: "experience",
          original: "Worked on speeding up API endpoints.",
          suggested: "Engineered latency optimizations for RESTful APIs, reducing p99 latency by [X%].",
          rationale: "Quantifies performance impact with an action verb.",
          needs_user_input: true,
          placeholders: ["[X%]"],
        },
      ];

      render(<BulletRewrites rewrites={rewrites} />);
      expect(screen.getByText(/worked on speeding up api endpoints/i)).toBeInTheDocument();
      expect(screen.getByText(/engineered latency optimizations/i)).toBeInTheDocument();
      expect(screen.getByText(/fill in your genuine metrics/i)).toBeInTheDocument();
    });

    it("renders roadmap timeline with verified resources and action checklist", () => {
      const steps: RoadmapStep[] = [
        {
          milestone: "Phase 1: Essential Foundations",
          goal: "Master Docker containerization",
          why_it_matters: "Prerequisite for scalable deployments.",
          actions: ["Build Dockerfile", "Run local container"],
          est_hours: 15,
          resource_ids: ["docker-get-started"],
          resources: [
            {
              id: "docker-get-started",
              title: "Docker Get Started Guide",
              platform: "Docker Docs",
              url: "https://docs.docker.com/get-started/",
              type: "doc",
              difficulty: "beginner",
              free: true,
              duration_hours: 5.0,
            },
          ],
        },
      ];

      render(<RoadmapTimeline steps={steps} />);
      expect(screen.getByText(/phase 1: essential foundations/i)).toBeInTheDocument();
      expect(screen.getByText(/master docker containerization/i)).toBeInTheDocument();
      expect(screen.getByText("Docker Get Started Guide")).toBeInTheDocument();

      const checkbox = screen.getByRole("button", { name: /build dockerfile/i });
      fireEvent.click(checkbox);
    });
  });
});

