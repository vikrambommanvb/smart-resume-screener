import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConstellationSVG } from "../features/constellation/ConstellationSVG";
import { ConstellationContainer } from "../features/constellation/ConstellationContainer";
import { canUseWebGL } from "../features/constellation/webglCheck";
import { SkillsSectionData } from "../types/api";

const mockSkills: SkillsSectionData = {
  matched: [
    { id: "python", name: "Python", category: "languages", importance: "required", evidence: "Built Python APIs" },
    { id: "fastapi", name: "FastAPI", category: "backend", importance: "required", evidence: "Used FastAPI" },
  ],
  partial: [
    { id: "docker", name: "Docker", category: "devops", importance: "required", evidence: "Basic Docker usage" },
  ],
  missing: [
    { id: "kubernetes", name: "Kubernetes", category: "devops", importance: "required" },
  ],
  total_count: 4,
};

describe("Constellation & Restrained Motion Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("webglCheck capability detection", () => {
    it("respects prefers-reduced-motion media query and returns false", () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(canUseWebGL()).toBe(false);
    });

    it("respects Save-Data connection header and returns false", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
      Object.defineProperty(navigator, "connection", {
        value: { saveData: true },
        configurable: true,
      });

      expect(canUseWebGL()).toBe(false);
    });
  });

  describe("ConstellationSVG Component", () => {
    it("renders SVG with center role hub and node points", () => {
      render(<ConstellationSVG skills={mockSkills} />);

      const svg = screen.getByRole("group", { name: /skill alignment constellation graph/i });
      expect(svg).toBeInTheDocument();

      expect(screen.getByText("TARGET ROLE")).toBeInTheDocument();
      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText("FastAPI")).toBeInTheDocument();
      expect(screen.getByText("Docker")).toBeInTheDocument();
      expect(screen.getByText("Kubernetes")).toBeInTheDocument();
    });

    it("displays hover tooltip when hovering over a node", () => {
      render(<ConstellationSVG skills={mockSkills} />);

      const pyNode = screen.getByRole("button", { name: /python \(matched\)/i });
      fireEvent.mouseEnter(pyNode);

      expect(screen.getByText("matched")).toBeInTheDocument();
    });
  });

  describe("ConstellationContainer Component", () => {
    it("renders fallback SVG constellation and displays legend with counts", () => {
      render(<ConstellationContainer skills={mockSkills} />);

      expect(screen.getByText("Skill Constellation Graph")).toBeInTheDocument();
      expect(screen.getByText(/matched \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/partial \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/missing \(1\)/i)).toBeInTheDocument();

      // SVG should be visible
      expect(screen.getByRole("group", { name: /skill alignment constellation graph/i })).toBeInTheDocument();
    });
  });
});
