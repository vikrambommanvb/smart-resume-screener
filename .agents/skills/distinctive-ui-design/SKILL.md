---
name: distinctive-ui-design
description: Use when designing or editing any UI in this project. Enforces the project's visual identity, typography, color and layout tokens, motion restraint, copywriting rules, and a checklist that prevents generic AI-generated look and feel.
---

# Distinctive UI design for Smart Resume Screener

## Mindset
Design as a studio lead whose client rejected templated work. Make choices specific to this product: a tool that lines a resume up against a job and shows exactly where they meet and where they don't. Spend boldness in ONE place (the skill constellation, see `r3f-scene-craft`) and keep everything else quiet and disciplined.

## Process (do this every time)
1. Write a short plan: palette (4-6 named hex values), type roles, layout concept in one sentence plus an ASCII wireframe, principles.
2. Review the plan against the checklist below. If any part is what you'd produce for any dark SaaS landing page, revise it and note what changed.
3. Build. Then screenshot at 390 / 768 / 1440 and critique. Remove one decorative element before finishing.

## Identity: "alignment"
Two documents (resume and job) are brought into register. Visual vocabulary: fine registration ticks at panel corners, thin crosshair guides on hover, overlap regions, nodes that settle into place. These marks carry meaning (alignment, state). Never add them as decoration where nothing is being aligned.

## Tokens (define in `apps/web/src/styles/tokens.css` under `@theme`)
- Surfaces: `ink-950 #0C0B1D` (page), `ink-900 #131230` (panel), `ink-800 #1C1B42` (raised), line `#2D2B5C` at 60% alpha.
- Text: `text-hi #ECEBFF`, `text-mid #A9A7D0`, `text-lo #7C7AA8` (large text only).
- Brand: `violet-500 #7C5CFF`, `violet-300 #B3A1FF`, `blue-500 #3E7BFF`, `blue-300 #8DB4FF`.
- Signal: `amber-400 #FFB547` (gaps, needs attention). One warm color only.
- Verify every text/background pair is at least 4.5:1 (3:1 for large text and UI borders) with a script, not by eye.
- Gradients appear in only three places: the hero light behind the 3D scene, the primary button, the score arc fill. No gradient text, no gradient card washes, no purple-to-pink.
- Radii by hierarchy, not one value: controls 8px, panels 12px, dropzone 20px. Depth on dark comes from 1px borders and a faint inner top highlight, not soft grey drop shadows.

## Typography
- Display: Bricolage Grotesque (variable, use the width and optical-size axes). Body and UI: Instrument Sans. Both self-hosted with `@fontsource-variable/*`, `font-display: swap`, preloaded. If a face is unavailable, choose another distinctive pair and record it in `docs/decisions.md`. Do not fall back to Inter, Roboto, Space Grotesk or system defaults for display.
- Scores and numerals: tabular figures from the body face. No monospace for small data labels.
- Scale: 12 / 14 / 16 / 18 / 22 / 28 / 40 / 56 / 72 using `clamp()`; line length under 70 characters; body line-height 1.55; headings 1.05-1.15.
- Headings are sentence case. Treat the headline type itself as design (tight tracking, a real weight contrast), not a neutral container.

## Layout and structure
- Left-align text. Center only the processing view's single status line.
- Structural devices must encode information. Numbered markers appear ONLY on the learning roadmap (a true sequence). Eyebrow labels above headings are not used.
- No grid of three identical feature cards. Vary scale and density: the results page has one dominant column and a quiet side rail.
- The first screen of the landing page opens with the product doing its job: a live dropzone beside the constellation, not a marketing paragraph.

## Motion
- No scroll-triggered fade-and-slide on sections. No hover lift on every card.
- Allowed: one orchestrated first-load sequence; motion that answers an action (file accepted, stage completed, panel expanded, copy confirmed); the analysis progress sequence driven by real stream events.
- Durations 150-300ms for small elements, up to 500ms for large; exits faster than entries; springs only for the constellation. Everything respects `prefers-reduced-motion`.

## Copy
- Plain verbs, active voice, sentence case. Buttons say exactly what happens: "Upload resume", "Analyse", "Copy suggestion". The same action keeps the same name everywhere ("Analyse" button, "Analysing" status, "Analysed" confirmation).
- Errors say what went wrong and how to fix it. They never apologise and never blame. Example: "This PDF has no selectable text. Export it again from your editor instead of scanning it, or try the scanned-document option."
- Empty states invite an action. Never use: "Unlock", "Supercharge", "Elevate", "Seamless", "Leverage", "Game-changing", "Your journey", "Powered by AI" as a headline.
- No arrows appended to button text. No middle-dot-joined metadata strings. No ALL-CAPS labels.

## Slop checklist (all must be false before you finish)
- Cream background plus serif plus terracotta accent? (not our direction)
- Near-black plus a single acid accent used on everything?
- Cards of identical size and radius with identical shadows?
- A single accented word inside a headline?
- Decorative numbering, eyebrows, or labels that add no information?
- Stock illustration, emoji, or generic 3D blob with no data meaning?
- Same fade-up animation on every section?
- Copy that could belong to any product?

## Quality floor
Responsive from 360px, visible focus rings (2px violet-300, offset 2px), WCAG 2.2 AA, touch targets 44px, no horizontal scroll, reduced-motion path, print stylesheet for the report.

