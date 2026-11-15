# Page Specification: Landing Page & Workbench

**Route:** `/`  
**Layout Mode:** Two-column analytical workbench with below-the-fold transparency modules  
**Responsive Behavior:** 1-column stacked on mobile/tablet, 50/50 split on desktop (`≥1024px`)  
**Associated Components:** `AnalysisDashboard.tsx`, `Dropzone.tsx`, `TargetJobSelector.tsx`, `ConstellationPreview.tsx`  

---

## 1. Hero & Workbench Overview

The landing page positions the user immediately into the evaluation workflow without promotional filler.

### Visual Architecture

- **Masthead:**
  - Sticky edge-aligned navigation bar (`h-16`).
  - Brand wordmark: `Smart Resume Screener` in `Host Grotesk` Medium (no decorative prefix dots).
  - Minimal right-aligned action: `Privacy` link targeting `/privacy`.
- **Hero Statement:**
  - Title: "Check your resume against one role" (`text-4xl sm:text-5xl md:text-6xl`, tracking `-0.03em`, leading `1.08`).
  - Subtitle: "A deterministic match score, verified evidence quotes, and a step-by-step roadmap." (`text-ink-2`, `text-base sm:text-lg`, max width `42rem`).

---

## 2. Workbench Components (The Two Columns)

### Column A: Resume Dropzone (`Dropzone.tsx`)

The dropzone handles local PDF ingestion strictly in browser memory.

- **Minimum Dimensions:** Min-height `280px` (desktop), flex column centered.
- **Surface Styling:**
  - Idle state: `bg-paper-2 border-2 border-dashed border-rule rounded-2xl p-8 hover:border-rule-2 transition-colors`.
  - Active drag-over state: `border-violet bg-violet-soft/10 ring-4 ring-violet/20`.
  - File loaded state: `border-ok/60 bg-ok-soft/10 border-solid`.
- **File Validation & Constraints:**
  - Format: Strictly PDF (`application/pdf`).
  - Size Limit: Maximum 5MB (`MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024`).
  - Direct feedback: File name, file size in KB/MB, and instant "Change file" button.
- **Accessible File Removal:**
  - Clear remove button with explicit `aria-label="Remove uploaded resume"`.
  - Keyboard trigger via Space/Enter keypresses.

### Column B: Target Job Selector (`TargetJobSelector.tsx`)

Enables candidates to benchmark against 14 curated industry roles or paste a custom Job Description.

- **Segmented Mode Toggle:**
  - 48px height segmented control with smooth indicator pill animation.
  - Option 1: "Curated role benchmark" (pre-mapped role taxonomies).
  - Option 2: "Custom job description" (candidate-provided text).
- **Curated Role Combobox:**
  - 50px input height with inline search filter across all 14 roles.
  - Keyboard accessible dropdown (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
  - Role preview card below selector:
    - Role title, senior/staff benchmark level.
    - Category tag (e.g., Backend, Frontend, Cloud & DevOps, Machine Learning).
    - Required skill chips rendered in `Host Grotesk` sentence case.
- **Custom Job Description Editor:**
  - Auto-expanding textarea with min-height `180px`.
  - Real-time character counter showing progress toward 50-character minimum requirement.
  - Clear validation warning if under threshold.

---

## 3. Analysis Submission Call-To-Action

- **Action Trigger:**
  - Full-width button: `Analyse resume →`.
  - Dimensions: `h-14` (56px), rounded-xl (`rounded-xl`), font-semibold.
  - Styling: Solid high-contrast `bg-accent text-paper hover:bg-accent/90 press-scale shadow-lg`.
  - State Gating: Enabled ONLY when a valid PDF file is selected AND (curated role selected OR custom JD ≥ 50 chars).
  - Loading State: Replaces icon with spinner, disables pointer events, and announces `aria-busy="true"`.

---

## 4. Below-the-Fold Transparency Modules

Directly below the primary workbench sits three structured verification sections:

### 1. Score Composition Ratio Bar
A full-width 5-segment mathematical visualizer explaining the deterministic weighting:
- **Skills (40%):** `#7C5CFF` (Violet)
- **Responsibilities (25%):** `#8DB4FF` (Cool Blue)
- **Experience (15%):** `#60A5FA` (Sky Blue)
- **Projects (15%):** `#818CF8` (Indigo)
- **Education (5%):** `#FFB547` (Amber)

Each segment displays its mathematical percentage and core evaluation criteria.

### 2. System Specifications Spec Sheet
A 4-column metric grid communicating system scope:
- **Catalog roles:** 14 verified targets
- **Taxonomy skills:** 143 mapped technical proficiencies
- **Curated resources:** 195 verified documentation URLs
- **Storage footprint:** 0 KB persistent storage

### 3. Privacy-by-Construction Guarantee
A dedicated technical card detailing:
- In-memory execution: Files are held only in RAM and discarded immediately.
- Automatic PII redaction: Names, emails, and phone numbers are scrubbed before evaluation.
- Deterministic reproducibility: Two identical runs yield the exact same score.
