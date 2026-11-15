# UI Critique & Slop Audit: Smart Resume Screener

> **Date:** November 13, 2026  
> **Evaluator:** Design Lead & Front-End Specialist  
> **Scope:** Pre-polish visual critique across 390px, 768px, and 1440px viewports based on automated screen captures and Lighthouse mobile runs.

---

## 1. Slop Checklist Evaluation (`distinctive-ui-design`)

| Question | Assessment | Evidence & Current Status |
|---|---|---|
| **Cream background + serif + terracotta accent?** | **False (PASS)** | Dark ink surfaces (`#0C0B1D`, `#131230`), Bricolage Grotesque display, Instrument Sans UI. |
| **Near-black + single acid accent on everything?** | **Partially True (DEFECT)** | Green (`#70E0A6`) was previously overused for matched skills and multiple badges. Fixed in Phase U0 so skill states strictly use brand violet (`#B3A1FF`), blue (`#8DB4FF`), and amber (`#FFB547`). Needs further cleanup in component borders. |
| **Cards of identical size and radius with identical shadows?** | **True (DEFECT)** | Currently, almost every card on the Landing and Results pages shares an identical `rounded-[12px] border border-ink-line bg-ink-900/60` treatment. There is insufficient scale/role contrast between panels, dropzones, and controls. |
| **A single accented word inside a headline?** | **False (PASS)** | Headlines are solid `text-hi #ECEBFF` without cheesy single-word gradient cutouts. |
| **Decorative numbering, eyebrows, or labels that add no info?** | **True (DEFECT)** | Eyebrows like `VERIFIED RESUME INTELLIGENCE` and uppercase decorative tags were present in earlier components. Corner registration ticks were applied mechanically to cards where no document alignment was occurring. |
| **Stock illustration, emoji, or generic 3D blob?** | **False (PASS)** | Zero emojis, zero stock vectors. 3D constellation is driven 100% by deterministic skill graph coordinates. |
| **Same fade-up animation on every section?** | **True (DEFECT)** | Default Motion transitions used repeated `opacity: 0, y: 15` on cascading cards. Needs elimination in favor of purposeful settled layouts. |
| **Copy that could belong to any product?** | **Partially True (DEFECT)** | Copy still had stray buzzwords ("supercharge", "next-gen intelligence") in placeholders. Must enforce the strict copy deck from Prompt Section 7. |

---

## 2. Visual & Structural Defect Catalog

### Critical & High Severity Defects
1. **Low Contrast on Micro-Labels (`results`):**
   - *Reference:* `audit_results_dashboard_1440.png`, `docs/perf/results_baseline.report.json`
   - *Issue:* 10px uppercase numerals and category tags use `text-text-lo` (`#6D6A94`) on `#131230`, producing a 3.4:1 contrast ratio (fails WCAG AA 4.5:1).
   - *Fix:* Promote data labels to `text-text-mid` (`#A9A7D0` $\to$ 5.8:1) and enforce tabular figures (`font-mono` or `tabular-nums`).

2. **Mobile Layout Cramping & Action Inaccessibility (390px):**
   - *Reference:* `audit_landing_selected_390.png`, `audit_results_dashboard_390.png`
   - *Issue:* On 390px mobile, after selecting a file and target role, the "Start Alignment Analysis" button scrolls completely off-screen below the fold, forcing unnecessary vertical hunting.
   - *Fix:* Implement a sticky bottom action bar on mobile (`sticky bottom-0`) with iOS safe-area padding (`pb-[env(safe-area-inset-bottom)]`).

3. **Heading Hierarchy & Missing Landmark (`privacy`):**
   - *Reference:* `audit_privacy_1440.png`, `docs/perf/privacy_baseline.report.json`
   - *Issue:* Skips `<h2>` heading level (jumps `<h1>` directly to `<h3>`) and lacks a `<main>` wrapper, causing an Accessibility score drop to 92.
   - *Fix:* Wrap in `<main>`, correct heading levels to `h1 -> h2 -> h3`.

### Medium Severity Defects
4. **Mechanical Application of Registration Ticks:**
   - *Reference:* `audit_landing_idle_1440.png`, `audit_results_dashboard_1440.png`
   - *Issue:* Decorative registration tick marks were stamped onto the Privacy card, Alternative Careers card, and Gallery cards. Ticks only make conceptual sense where *alignment* occurs.
   - *Fix:* Restrict registration ticks strictly to: (1) The Dropzone, (2) The Match Score gauge, and (3) The Evidence drawer. Strip them from all other surfaces.

5. **Uniform Border Radius Hierarchy:**
   - *Reference:* `audit_gallery_1440.png`
   - *Issue:* All containers currently use `rounded-[10px]` or `rounded-[12px]`.
   - *Fix:* Enforce role-based radii: Controls `8px` (`rounded-lg`), Panels `12px` (`rounded-xl`), Dropzone & Slide Drawers `20px` (`rounded-[20px]`).

6. **Results Dashboard Lacks Side Rail / Anchor Navigation on Desktop:**
   - *Reference:* `audit_results_dashboard_1440.png`
   - *Issue:* The results view is an expansive single vertical scroll column. Desktop users at 1440px have no quick way to jump between Score, Skills, Rewrites, Roadmap, and Interview sections.
   - *Fix:* Implement a 240px sticky left navigation rail on desktop (`lg:block w-60 sticky top-20`) and bottom bar navigation on mobile.

7. **Placeholder Editing Missing in Bullet Rewrites:**
   - *Reference:* `audit_results_dashboard_1440.png`
   - *Issue:* Bullet rewrites show bracketed placeholders like `[X]%` as inert static text. Users cannot directly type their metrics into the suggestion before copying.
   - *Fix:* Render inline `<input>` fields directly within the rewritten bullet text for every bracketed item, automatically updating the clipboard payload with a live counter ("2 placeholders to fill").

8. **Target Role Selector Uses Basic HTML `<select>`:**
   - *Reference:* `audit_landing_idle_1440.png`
   - *Issue:* The role selector is a plain `<select>` dropdown without search filtering, skill preview, or seniority tags.
   - *Fix:* Replace with a searchable keyboard-navigable Combobox displaying role title, 1-line summary, and 5 core skill badges.

---

## 3. Generic Patterns Identified for Removal

1. **Card Hover Lifts:** Cards translated `-y-1` on hover with fuzzy grey drop shadows. Removed in favor of 1px border highlight (`hover:border-ink-line`) and subtle inner top highlight.
2. **Generic Feature Grids:** The 3-column feature card layout on the landing page is removed. Replaced with the "How the score works" 5-part horizontal composition bar and a crisp 4-sentence privacy summary.
3. **Repeated Fade-Ups:** Fade-and-slide motion on every subcomponent is eliminated. Motion is reserved for user interactions (file accepted, panel expanded, copy confirmed).

---

## 4. Prioritised Fix List for Phase U2 & U3

| Priority | Phase | Component / Screen | Action Item |
|---|---|---|---|
| **P0** | **U2** | `tokens.css` & Typography | Establish 4px base scale, fluid clamp type, role-based radii (8/12/20px), depth on dark (no grey shadows), 2px focus ring. |
| **P0** | **U3** | Results Dashboard Layout | Add 240px sticky rail on desktop / bottom nav on mobile; move focus to `#results-heading` once on arrival. |
| **P0** | **U3** | Bullet Rewrites | Implement side-by-side comparison with inline placeholder `<input>` chips and dynamic clipboard copy. |
| **P1** | **U3** | Dropzone Overhaul | Animated 4px inward ticks on drag-over; real `<label>`; snap into place on file selection; inline errors (no toasts). |
| **P1** | **U3** | Target Job Selector | Searchable Combobox for roles with core skill previews; auto-expanding textarea for custom JD with live character counter. |
| **P1** | **U3** | Landing Above-the-fold | Side-by-side hero on desktop (dropzone + 2D constellation preview); mobile sticky action button; score breakdown bar below fold. |
| **P2** | **U3** | Copy Deck Enforcement | Audit and replace all headers, labels, and helper text with exact copy deck from prompt section 7. |
| **P2** | **U3** | Evidence Drawer | Replace modal with 400px side slide-over on desktop and bottom sheet on mobile with verified quote highlight. |
| **P2** | **U4** | Constellation Motion | Zero CLS `600x400` container, settle motion once, orbit on drag only, wrap app root in `<MotionConfig reducedMotion="user">`. |
| **P3** | **U5** | Final QA & Perf Audit | Re-run Lighthouse on all viewports, verify WCAG AA 100%, verify print stylesheet. |

