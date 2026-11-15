---
name: accessible-motion
description: Use when adding animation, transitions, charts, keyboard interaction, focus handling, or any dynamic UI state. Covers Motion library usage, reduced motion, ARIA live regions, accessible data visualisation, and keyboard-operable file upload.
---

# Accessible motion and interaction

- Import from `motion/react`. Use `LazyMotion` with `domAnimation` and `m` components where possible to limit bundle size.
- Wrap the app in `MotionConfig reducedMotion="user"`. For custom animation, branch on `useReducedMotion()`: swap movement for a short fade or no change.
- Exits: use `AnimatePresence` and `onExitComplete`; never wait with `setTimeout`.
- Upload dropzone: a real `<input type="file" accept="application/pdf">` reachable by keyboard, a visible label, drag state announced, file name and size shown after selection, a remove button. Validate type and size client-side for speed; the server remains authoritative.
- Progress: a single `aria-live="polite"` region announces stage changes. The visual sequence is driven by real stream events, never a fake timer.
- Charts and score arcs: provide a text equivalent (`<table>` or definition list) in the DOM. Score arc has `role="img"` plus a label such as "Match score 72 out of 100".
- Focus: after results stream in, move focus to the results heading once. Do not steal focus on each section update. Errors move focus to the error summary.
- Tabs, disclosure and dialog use shadcn/Radix primitives; do not hand-roll them.
- Test with keyboard only and with axe in Playwright. Zero serious or critical violations.

