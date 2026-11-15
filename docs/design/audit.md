# Hallmark Audit Report: Smart Resume Screener

> Audited with `sloplint.mjs` against Hallmark Floor, Reflex, and Finish gates.
> Target: `apps/web/src` · Scope: `app` · Genre: `modern-minimal` (with `atmospheric` landing hero).

---

## 1. Sloplint Automated Audit Findings

**Summary**: 91 FAIL, 46 REFLEX, 18 WARN across 34 source files. Every finding is logged in `.hallmark/before.txt` and `.hallmark/before.json`.

### Critical Floor Violations (Non-Waivable)
- **FAIL 2a (Purple-to-Blue Gradients)**: `ScoreSummary.tsx:166` uses `bg-gradient-to-r from-violet-500 to-blue-400`. The Floor bans purple-to-blue gradients entirely.
- **FAIL 10a (Indiscriminate Transitions)**: 18 occurrences of `transition-all` (in `Progress.tsx`, `Tabs.tsx`, `AnalysisDashboard.tsx`, etc.). Rule 2 requires specific named properties (`transition-colors`, `transition-opacity`, `transition-transform`).
- **FAIL 48 (Literal Colours Outside Tokens)**: 43 occurrences of arbitrary color literals (e.g. `text-[#70E0A6]`, `border-[#7D2433]`, `text-[#FF8596]`, `bg-[#291F0E]`, `shadow-[inset_0_1px_0_rgba(236,235,255,0.05)]`). Rule 1 mandates that every color must be defined at `:root` as a token.
- **FAIL 54 & 67 (Eyebrows & Tracked Capitals)**: 27 occurrences of tracked uppercase monospace labels (`font-mono uppercase tracking-wider`), including "404 Error", "Alignment Constellation", "Score / 100", "Report Sections", "Verified Evidence". Rule 9 bans eyebrows and tracked uppercase labels: micro-labels must be body face, sentence/lower case, untracked.
- **FAIL 63 (Middle-Dot Meta Strings)**: `ScoreSummary.tsx:121` uses `Thresholds: 40 Partial • 60 Solid • 80 Strong`. Meta strings must use hairlines, columns, or line breaks instead of bullet glue.
- **FAIL 33 (Accessibility on SVG)**: `ScoreSummary.tsx:76` uses `<svg>` without `aria-hidden="true"` or `aria-label`.

### Reflex Violations (Model Default Tells)
- **REFLEX 64 (Monospace Overuse)**: 46 occurrences of `font-mono` on regular UI prose and captions (e.g. "Drop a PDF resume above...", "Zero data retention", "Return to screener", "Original resume bullet"). Monospace must be reserved exclusively for code, data hashes, and tabular numerals.

### Warnings
- **WARN 29 (Stacked Glass/Glow Effects)**: `SkillsMatrix.tsx:156` stacked `backdrop-blur-sm` over `bg-black/60` and `shadow-[0_0_8px_rgba(179,161,255,0.6)]`. Hallmark requires elevation by lightness, clean hairlines, and restrained offset shadows.
- **WARN F24 (Hairline Border Under Wide Soft Shadow)**: `TargetJobSelector.tsx:214` and `.glass-panel` combined a hairline border with heavy soft drop shadows. Hallmark mandates committing to one: clean edge definition or shadow elevation.
- **WARN 58 (Hero Word Count)**: H1 in `App.tsx` runs 9 words ("See how your resume reads against a real job."). Rule 13 targets 7 words or fewer.

---

## 2. Qualitative Answers & Screenshot Analysis

### 1. What on these screens would look identical in any other dark SaaS product?
- The ubiquitous dark ink backdrop (`#0C0B1D`, `#131230`) adorned with soft violet/blue radial glows and frosted glass surfaces (`backdrop-blur-sm`, `glass-panel`). It mimics a generic AI landing page template.
- The floating pill-style header and segmented controls styled with generic borders and soft shadows.
- *Screenshot References*:
  - Desktop Landing: [`landing_idle_1440.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/landing_idle_1440.png)
  - Desktop Selected: [`landing_file_chosen_1440.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/landing_file_chosen_1440.png)

### 2. Where is structure (borders, numbers, labels, ticks, dividers) decorating instead of carrying information?
- **Corner Registration Ticks**: The registration marks (`withRegistrationMarks`) applied to almost every card across the landing page and dashboard are decorative gimmicks that clutter the visual field without conveying alignment data.
- **Upper-Case Tracked Labels**: Small 10px-11px monospace uppercase tags ("REPORT SECTIONS", "SCORE / 100", "ORIGINAL RESUME BULLET", "WHY INTERVIEWERS ASK THIS") add artificial structure that competes with actual content.
- **Card-in-Card Nesting**: `HealthAudit.tsx`, `ScoreSummary.tsx`, and `AnalysisDashboard.tsx` feature cards nested inside panels nested inside glass containers, creating layered borders that add no semantic meaning.
- *Screenshot References*:
  - Results Dashboard Desktop: [`results_dashboard_1440.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/results_dashboard_1440.png)
  - Results Dashboard Tablet: [`results_dashboard_768.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/results_dashboard_768.png)

### 3. Which text, colour or motion exists only because a template usually has it?
- The purple-to-blue gradient in `ScoreSummary.tsx` on the score meter bar.
- The decorative "Sample projection" badge with a blue dot next to the constellation hero.
- `transition-all` slapped on 18+ components instead of purposeful single-property transitions (`transition-colors`, `transition-transform`).
- Monospace font applied to conversational help text ("Drop a PDF resume above to begin alignment analysis.", "Session ID: sample-audit").
- *Screenshot References*:
  - Landing Idle: [`landing_idle_1440.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/landing_idle_1440.png)
  - Results Dashboard: [`results_dashboard_1440.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/results_dashboard_1440.png)

### 4. What is the first thing a person sees at 390 px, and is it the product?
- At mobile viewports (320px, 375px, 414px), the top fold is consumed by the title, an oversized headline, a multi-line paragraph, and a large decorative 2D SVG constellation graphic.
- **The actual product—the resume dropzone and target role selection—is completely pushed below the fold.** A job seeker on a phone must scroll past 400px of introductory fluff to perform the single job they came to do.
- *Screenshot References*:
  - Mobile 320px: [`landing_idle_320.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/landing_idle_320.png)
  - Mobile 375px: [`landing_idle_375.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/landing_idle_375.png)
  - Mobile 414px: [`landing_idle_414.png`](file:///Users/sivabalan/Documents/SMART%20RESUME%20SCREENER/docs/design/before/landing_idle_414.png)
