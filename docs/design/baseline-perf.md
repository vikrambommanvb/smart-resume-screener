# Baseline Performance & Accessibility Measurements

> Measured headlessly via Lighthouse CLI (mobile throttled emulation) on production build served on local preview server (`http://127.0.0.1:4173`).
> Raw JSON reports saved in `docs/perf/landing_polished.report.json`, `docs/perf/results_polished.report.json`, and `docs/perf/privacy_polished.report.json`.

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS (Measured) | TBT | Byte Weight |
|---|---|---|---|---|---|---|---|---|
| **Landing (`/`)** | **100** | **100** | **96** | **100** | 0.8s | **0.000** | 0 ms | 374 KiB |
| **Results (`/results`)** | **100** | **100** | **100** | **100** | 0.8s | **0.000** | 40 ms | 374 KiB |
| **Privacy (`/privacy`)** | **100** | **100** | **100** | **100** | 0.8s | **0.000** | 0 ms | 374 KiB |
