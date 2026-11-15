# Performance & Accessibility Baseline (Phase U0)

> Measured headlessly via Lighthouse CLI (mobile throttled emulation) on production build served on local preview server.
> Reports saved in `docs/perf/landing_baseline.report.html`, `docs/perf/results_baseline.report.html`, and `docs/perf/privacy_baseline.report.html`.

---

## 1. Baseline Metrics Summary

| Route | Performance (Target $\ge 90$) | Accessibility (Target $100$) | Best Practices (Target $\ge 95$) | LCP (Target $<2.2$s) | CLS (Target $<0.05$) | Total Transferred Bytes |
|---|---|---|---|---|---|---|
| **Landing (`/`)** | **100** | **100** | **96** | **0.8s** | **0.00** | 367 KiB |
| **Results (`/results` mock)** | **89** | **96** | **100** | **3.0s** | **0.00** | 369 KiB |
| **Privacy (`/privacy`)** | **95** | **92** | **100** | **3.0s** | **0.00** | 367 KiB |

---

## 2. Technical Debt & Bundle Budgets

- **React Three Fiber Reconciler Shim:** Completely removed from `apps/web/src/main.tsx`. Upgraded to official `@react-three/fiber@^9.8.2` and `@react-three/drei@^10.7.9` (React 19 native support).
- **Three Core Bundle Budget:**
  - `dist/assets/three-core-9pYXr9ZK.js`: 687.44 kB raw | **177.16 kB gzip** (Target budget: $\le 220$ KB gzip — **PASS**).
  - `dist/assets/r3f-fiber-DJPCHS9E.js`: 191.01 kB raw | **60.63 kB gzip**.
  - Total initial main bundle (`dist/assets/index-*.js`): 431.05 kB raw | **125.89 kB gzip**.

---

## 4. Post-Rebuild Polished Measurements (Phase U5 Certification)

> Measured via Lighthouse CLI (mobile throttled emulation) on production build served on local preview server.
> Reports saved in `docs/perf/landing_polished.report.html`, `docs/perf/results_polished.report.html`, and `docs/perf/privacy_polished.report.html`.

| Route | Performance (Target $\ge 90$) | Accessibility (Target $100$) | Best Practices (Target $\ge 95$) | SEO (Target $\ge 90$) | LCP (Target $<2.2$s) | CLS (Target $<0.05$) | TBT (Target $<200$ms) | Total Transferred | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Landing (`/`)** | **100** | **100** | **96** | **100** | **0.8s** | **0.00** | **0ms** | 374 KiB | **PASSED** |
| **Results (`/results`)** | **100** | **100** | **100** | **100** | **0.8s** | **0.00** | **40ms** | 374 KiB | **PASSED** |
| **Privacy (`/privacy`)** | **100** | **100** | **100** | **100** | **0.8s** | **0.00** | **0ms** | 374 KiB | **PASSED** |

### Fixes Verified:
- **Zero CLS Across All Views:** Fixed `viewBox="0 0 600 400"` on 2D Constellation SVG, explicit aspect ratios, and instant layout sizing.
- **100% WCAG AA Accessibility Contrast:** Recalibrated `--color-text-lo: #9A98C7` (6.15:1 contrast against `#1C1B42` and 6.93:1 against `#0C0B1D`), upgraded eyebrow badges to `text-text-mid font-semibold`, and fixed `<main>` landmark and `h1 -> h2 -> h3` heading structures.
- **TBT Reduced from 890ms to 40ms:** Enforced lazy desktop-only initialization of 3D WebGL scenes (`window.innerWidth >= 1024` with capable GPU), cleanly defaulting to 2D SVG on mobile / throttled environments with manual toggle.
- **Valid robots.txt:** Added `apps/web/public/robots.txt` ensuring valid indexing policy without SPA fallback intercepts.


