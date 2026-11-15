# Smart Resume Screener — Master Design System

**Architecture:** Dark Swiss Minimalism & Editorial Typography  
**Aesthetic Genre:** Modern Minimalist Analytical Workbench  
**Target Environment:** High-performance responsive web application (`apps/web`, React 19, Tailwind CSS v4, Three.js)  
**Primary Artifact:** Living Design System & Frontend Technical Specification  

---

## 1. Design Philosophy & Architectural Tenets

Smart Resume Screener is designed as an analytical workbench rather than a marketing dashboard or generic SaaS portal. The interface is engineered to inspire trust, deliver immediate clarity, and empower candidates with deterministic evaluation and verified evidence.

### Core Principles

1. **Analytical Credibility Over Marketing Gloss:**
   Every visual element directly represents structured data. We reject arbitrary ornamentation, decorative floating shapes, ambient neon gradients, and generic AI sparkles. Visual density is purposeful, legible, and balanced.

2. **Deterministic Transparency:**
   The UI emphasizes that scoring is deterministic and mathematical (40% skills, 25% responsibilities, 15% experience, 15% projects, 5% education). The system never fabricates ATS scores or presents opaque AI judgments without verified resume quotes.

3. **Restrained Editorial Hierarchy:**
   We balance display typography (Host Grotesk) with high-legibility body prose and dedicated monospace data figures (Atkinson Hyperlegible Mono). Typographic hierarchy is achieved through scale, line height, and contrast rather than heavy drop shadows or excessive borders.

4. **Zero-Retention Assurance by Design:**
   Privacy is not an afterthought; it is structurally communicated through prominent 0 KB footprint indicators, ephemeral lifecycle diagrams, and explicit technical explanations of in-memory redaction.

5. **Fluid Physical Motion:**
   Animations obey real-world physical decay: snappy starts, smooth exponential decelerations, and zero bouncy overshoots. Micro-interactions reward user exploration without delaying workflows.

---

## 2. Core Color Palette & Token System

The color system is built on a Deep Indigo paper ramp. The background is not a harsh flat black (`#000000`), but a deep, oceanic navy indigo that reduces eye fatigue during extended technical audits.

### Surface Tokens (The Paper Ramp)

| Token Name | Hex Code | OKLCH Equivalent | Usage Context |
| :--- | :--- | :--- | :--- |
| `paper` | `#0C0B1D` | `oklch(0.12 0.04 278)` | Root canvas background, global page backdrop |
| `paper-2` | `#131230` | `oklch(0.16 0.05 278)` | Primary elevated container surface, cards, header |
| `paper-3` | `#1C1B42` | `oklch(0.20 0.06 278)` | Secondary card surfaces, nested rows, tab strips |
| `rule` | `#2B2A56` | `oklch(0.27 0.05 278)` | Standard structural dividers, card borders (1px) |
| `rule-2` | `#3D3B74` | `oklch(0.35 0.06 278)` | Hover borders, active selection outlines |

### Ink Tokens (Typographic Contrast)

| Token Name | Hex Code | OKLCH Equivalent | Usage Context |
| :--- | :--- | :--- | :--- |
| `ink` | `#F1F1F8` | `oklch(0.96 0.01 278)` | Primary headings, active metrics, primary labels |
| `ink-2` | `#A2A1C2` | `oklch(0.72 0.04 278)` | Body text, section descriptions, secondary metrics |
| `muted` | `#6C6A94` | `oklch(0.52 0.05 278)` | Inactive metadata, timestamps, subtle helper text |

### Semantic Accent Tokens

Every semantic accent has a corresponding 12–15% opacity soft background token for accessible chips and badge containers:

| Semantic Role | Solid Token | Soft Background Token | OKLCH / Hex | Application |
| :--- | :--- | :--- | :--- | :--- |
| **Brand / Match** | `violet` (`#7C5CFF`) | `violet-soft` (`rgba(124, 92, 255, 0.14)`) | `oklch(0.60 0.22 285)` | Exact skill matches, primary CTA, constellation core |
| **Partial / Info** | `cool` (`#8DB4FF`) | `cool-soft` (`rgba(141, 180, 255, 0.14)`) | `oklch(0.76 0.12 255)` | Partial skill matches, informational badges, tips |
| **Gap / Warning** | `accent` (`#FFB547`) | `accent-soft` (`rgba(255, 181, 71, 0.14)`) | `oklch(0.80 0.16 75)` | Missing required skills, warnings, priority gaps |
| **Success / Valid** | `ok` (`#4ADE80`) | `ok-soft` (`rgba(74, 222, 128, 0.14)`) | `oklch(0.82 0.19 145)` | Passing health checks, verified evidence quotes |
| **Critical / Fix** | `bad` (`#F87171`) | `bad-soft` (`rgba(248, 113, 113, 0.14)`) | `oklch(0.68 0.19 25)` | Critical ATS formatting traps, parse errors |

---

## 3. Typography System & Type Hierarchy

The application employs two complementary typefaces:
- **Display & Headings:** `Host Grotesk` (Editorial Swiss sans-serif with geometric precision and open apertures)
- **Monospace Figures & Data:** `Atkinson Hyperlegible Mono` (Engineered for uncompromised legibility in tabular metrics, scores, code tokens, and system counters)

### Typographic Scale

| Role | Font Family | Size (px / rem) | Line Height | Tracking | Weight |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Host Grotesk | `56px / 3.5rem` | `1.08` | `-0.03em` | Medium (500) |
| **Section Title** | Host Grotesk | `32px / 2.0rem` | `1.15` | `-0.02em` | Medium (500) |
| **Card Header** | Host Grotesk | `24px / 1.5rem` | `1.20` | `-0.01em` | Medium (500) |
| **Subheading** | Host Grotesk | `18px / 1.125rem`| `1.30` | `0` | Semibold (600) |
| **Body Large** | System / Sans | `16px / 1.0rem` | `1.50` | `0` | Regular (400) |
| **Body Standard** | System / Sans | `14px / 0.875rem`| `1.50` | `0` | Regular (400) |
| **Metric Display** | Atkinson Mono | `48px / 3.0rem` | `1.0` | `-0.02em` | Bold (700) |
| **Micro Data** | Atkinson Mono | `12px / 0.75rem` | `1.4` | `0` | Medium (500) |

---

## 4. Spacing, Grid & Layout Structure

The layout adheres to a strict 4px baseline grid (`rem` equivalents in Tailwind):

- **Baseline Spacing Scale:** `4px (0.25rem)`, `8px (0.5rem)`, `12px (0.75rem)`, `16px (1.0rem)`, `24px (1.5rem)`, `32px (2.0rem)`, `48px (3.0rem)`, `64px (4.0rem)`.
- **Global Canvas Width:** Maximum container width `1500px`.
- **Responsive Gutters:**
  - Mobile (`<640px`): `px-6` (24px)
  - Tablet (`640px–1024px`): `px-10` (40px)
  - Desktop (`>1024px`): `px-16` (64px)
- **Workbench Ratio:** Two-column grid with a 50/50 split on large screens (`grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10`).
- **Interactive Touch Targets:** All interactive triggers (buttons, tabs, combobox rows, checkboxes, accordions) strictly meet or exceed `44px × 44px` physical touch bounds.

---

## 5. Surface Elevation & Border Treatment

Depth is created through value contrast, precise borders, and subtle dark shadows:

- **Border Radii:**
  - Standard interactive controls: `rounded-lg` (8px)
  - Badges & small chips: `rounded-md` (6px)
  - Cards & container panels: `rounded-2xl` (16px)
  - Floating drawers & major sections: `rounded-3xl` (24px)
- **Border Hierarchy:**
  - Idle card border: `border border-rule/80` (`#2B2A56` at 80% opacity)
  - Interactive hover: `hover:border-rule-2` (`#3D3B74`)
  - Active focus ring: `focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-paper`
- **Surface Elevation:**
  - Level 1 (Base): `bg-paper`
  - Level 2 (Card): `bg-paper-2 border border-rule/80 shadow-lg shadow-black/10`
  - Level 3 (Sub-card / Row): `bg-paper-3/40 border border-rule/60`
  - Level 4 (Modal / Drawer): `bg-paper-2 border border-rule shadow-2xl shadow-black/40`

---

## 6. Motion Design & Animation Choreography

Animations communicate state transitions with clarity and speed:

- **Timing Constants:**
  - Micro-interactions (hover, press, toggle): `120ms – 160ms`
  - Container expansion / accordions: `240ms – 300ms`
  - Page entry & module cascading: `320ms – 400ms`
- **Easing Curve:**
  - Exponential ease-out: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy entry, graceful deceleration)
  - Standard ease-in-out: `cubic-bezier(0.4, 0, 0.2, 1)` (size transitions)
- **Reduced-Motion Mandate:**
  Every transition is wrapped in motion queries or respects `prefers-reduced-motion: reduce`. When reduced motion is requested, translations and scaling are eliminated, replacing them with instant opacity fades.

---

## 7. Chart & Data Visualization Standards

Data visualizations must remain accessible, informative, and visually integrated:

1. **Constellation Graph (2D Vector & 3D WebGL):**
   - **2D Mode:** Rendered via responsive SVG vector geometry. Node positions are dynamically calculated using force-directed graph topologies. Hub nodes represent core job categories; leaf nodes represent candidate skills.
   - **Node Color Mapping:**
     - Matched skills: `#7C5CFF` (Violet) with subtle glow ring
     - Partial skills: `#8DB4FF` (Cool Blue)
     - Missing requirements: `#FFB547` (Amber) with dashed perimeter
   - **3D Mode (WebGL):** Lazy-loaded Three.js canvas with smooth orbit controls and depth attenuation. Fallback to 2D occurs seamlessly on touch devices or low-power hardware.

2. **270° Score Arc Gauge:**
   - Visualized as a 270-degree circular SVG stroke with start angle `-225°` and end angle `+45°`.
   - Distinct notch markers at key evaluation thresholds: `40` (Partial alignment), `60` (Solid match), and `80` (Strong match).
   - Animated score counter increments with easing upon report initialization.

3. **Ratio Progress Bars:**
   - Multi-segment horizontal ratio bar showing exact 5-factor mathematical composition: Skills (40%), Responsibilities (25%), Experience (15%), Projects (15%), Education (5%).
   - Color-coded segments with accessible ARIA progressbar semantics.

---

## 8. Anti-Patterns & Visual Restrictions

To maintain a professional, high-trust engineering aesthetic, the following patterns are strictly forbidden:

- ❌ **No Purple-to-Pink Gradients:** Avoid standard AI-slop gradients (`from-purple-500 to-pink-500`).
- ❌ **No Blurry Glassmorphism Overuse:** Do not apply heavy `backdrop-blur-md` across multiple stacked layers.
- ❌ **No UI Emojis:** Never use emojis (🚀, ✨, 🔥, 🎯) as UI icons or bullet markers. Use verified Lucide SVG icons.
- ❌ **No Uppercase Tracked Micro-Labels:** Body labels must use title case or sentence case without forced letter-spacing.
- ❌ **No Fabricated Social Proof:** Never display fake user counts, fabricated testimonial stars, or misleading ATS pass percentages.
- ❌ **No Bouncy Overshoot Motion:** Avoid bouncy physics that wobble elements past their target resting states.
