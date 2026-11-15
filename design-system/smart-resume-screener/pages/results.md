# Page Specification: Analysis Report Dashboard

**Route:** `/results` or `/` (State `status === "completed"`)  
**Layout Mode:** Two-column analytical cockpit (Sticky navigation rail on desktop + Scrollable content canvas)  
**Associated Modules:** 8 comprehensive analytical sections in `src/features/results/`  

---

## 1. Global Report Masthead & Session Metadata

The top of the report establishes analytical authority and provides essential session actions:

- **Session Context:**
  - Session Identifier: e.g., `Session req_5933cca8` rendered in Atkinson Mono (`text-xs text-muted font-outlier`).
  - Processing Latency: e.g., `Elapsed 67ms` (calculated deterministically from API response headers).
- **Primary Actions:**
  - `Print report`: Opens the browser print preview with a dedicated `@media print` stylesheet.
  - `Try another resume`: Clears active analysis and returns the user to the workbench.
- **AI Degraded Banner (Conditional):**
  - Renders if `data.meta?.degraded_mode === true`.
  - Informs the user that algorithmic matching is fully intact, but generative bullet enhancements are temporarily operating on local heuristics.

---

## 2. Navigation Architecture & Scrollspy

### Desktop Navigation Rail (`w-64 shrink-0 hidden lg:block sticky top-24`)
- **Sticky Anchor List:**
  - Direct links to all 8 modules:
    1. Match estimate
    2. Constellation graph
    3. Required skills
    4. Resume health
    5. Bullet improvements
    6. Learning roadmap
    7. Career pathways
    8. Interview prep
- **IntersectionObserver Scrollspy:**
  - Highlights the currently active viewport section with a violet accent pill and high-contrast text.
  - Smooth scroll behavior with keyboard accessibility (`Tab` + `Enter`).

### Mobile Section Jump Bar (`block lg:hidden sticky top-16 z-30`)
- Horizontally scrollable tab strip with smooth swipe indicators and touch targets ≥ 44px.

---

## 3. The Eight Analytical Report Modules

### Module 1: Match Estimate (`ScoreSummary.tsx`)
- **270° Circular SVG Score Arc:**
  - Diameter: 180px with stroke width 14px.
  - Color ramp: Bad red (<40) -> Warning amber (40–59) -> Info cool blue (60–79) -> Brand violet (80+).
  - Score Counter: Atkinson Mono bold font with animated counter ease-in.
  - Notches at thresholds: 40 (Partial), 60 (Solid), 80 (Strong).
- **Legal Score Disclaimer:**
  - "This score estimates how closely your resume lines up with this role. It is not what an employer's hiring system calculates."
- **Alignment Component Breakdown:**
  - 5 progress bars showing sub-scores for Skills (40 pts), Responsibilities (25 pts), Experience (15 pts), Projects (15 pts), and Education (5 pts).
- **Highest Impact Improvements:**
  - 3 prioritized recommendations showing potential point gains (e.g., `TypeScript +4 pts`).

### Module 2: Skill Constellation Graph (`ConstellationContainer.tsx`)
- **Dual Visual Modes:**
  - **2D Mode (Default):** Interactive SVG node graph with zoom/pan and physics-based force layout.
  - **3D Mode (WebGL):** Three.js OrbitControls canvas with interactive sphere particles.
- **Node Geometry & Color Legend:**
  - Center Role Hub: Deep Indigo with Violet boundary.
  - Matched Skills: `#7C5CFF` (Violet) solid node.
  - Partial Skills: `#8DB4FF` (Cool Blue) half-filled node.
  - Skill Gaps: `#FFB547` (Amber) outline node.

### Module 3: Required Skills Matrix (`SkillsMatrix.tsx`)
- **Categorized Tabs:**
  - Languages, Frameworks, Cloud & Infrastructure, Data & Databases, Developer Tools.
- **Tri-State Status Indicators:**
  - `● Match` (Violet)
  - `◐ Partial` (Cool Blue)
  - `○ Gap` (Amber)
- **Verified Evidence Drawer:**
  - Clicking any matched skill slides open a right-side drawer containing the exact verbatim quotation extracted from the candidate's resume.
  - Quotation rendered in 18px Host Grotesk font with page number and section source.

### Module 4: Resume Health Audit (`HealthAudit.tsx`)
- **Machine Readability Metric:**
  - ATS compatibility score (e.g., `81 / 100 ATS Optimized`).
- **6-Dimension Metric Grid:**
  - Action Verbs & Impact
  - Standard Section Headers
  - ATS Parser Friendliness
  - Bullet Length & Readability
  - Tense & Punctuation Consistency
  - Contact Links & Portfolio
- **Audited Findings Filter:**
  - Filter tabs: All, Critical (Fix), Warnings, Tips (Consider).
  - Expandable finding cards with clear remediation instructions.

### Module 5: Bullet Point Rewrites (`BulletRewrites.tsx`)
- **Side-by-Side Comparison:**
  - Left column: Original resume bullet with struck-through text and detected weaknesses.
  - Right column: High-impact rewrite incorporating quantifiable metrics (`[X]%`).
- **Interactive Metric Injection:**
  - Candidate can click bracketed metric placeholders to enter real numbers directly in the UI.
- **One-Click Copy:**
  - Copy button with instant checkmark state and accessible toast announcement.

### Module 6: Personalized Learning Roadmap (`RoadmapTimeline.tsx`)
- **Three-Phase Milestone Timeline:**
  - Phase 1: Essential Foundations (Immediate gaps)
  - Phase 2: Applied Competencies (Project-based integration)
  - Phase 3: Production Integration (Portfolio & resume proof)
- **Estimated Hours Badges:**
  - Monospace time estimates (e.g., `Est. 15 hours`).
- **Interactive Action Checklist:**
  - 44px accessible checkboxes allowing candidates to track progress locally.
- **Verified Documentation Resources:**
  - Clickable cards linking to official documentation and trusted courses (no dead or unverified links).

### Module 7: Alternative Career Pathways (`AlternativeCareers.tsx`)
- **Three-Column Role Cards:**
  - Benchmarks against 3 adjacent roles in the catalog (e.g., Backend Developer, DevOps Engineer, Full Stack Developer).
- **Fit Bands:**
  - Strong fit (`brand`), Good fit (`info`), Possible fit (`neutral`).
- **Skill Overlap Breakdown:**
  - Matched strengths (Violet tags in Title Case).
  - Gaps to bridge (Amber tags in Title Case).

### Module 8: Interview Preparation (`InterviewPrep.tsx`)
- **Categorized Accordion Panels:**
  - Technical Architecture Questions
  - Behavioral & Ownership Scenarios
  - Gap-Defense Strategy (how to explain missing skills constructively)
- **Accordion Anatomy:**
  - Question title with 44px hit target.
  - "Interviewer Motivation": Explains why hiring managers ask this specific question.
  - "Key Talking Points": Bulleted checklist grounded in the candidate's verified resume experience.

---

## 4. Print & Export Architecture

When the user triggers `Print report`:
- All interactive controls, navigation rails, mode toggles, and buttons are hidden via `@media print`.
- Page background converts to pure white with crisp black text.
- Page break guards (`break-inside: avoid`) prevent awkward splitting of cards across printed pages.
