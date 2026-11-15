---
name: production-gates
description: Use at the end of every phase and before declaring any work complete. Defines test, performance, accessibility, security, privacy and deployment gates with measurable thresholds and the evidence to attach.
---

# Production gates

## Backend
- `pytest` green with coverage >= 85% on `pipeline/`, `llm/guards.py`, scoring and health modules.
- Scoring tests: determinism (same input, same output), monotonicity (adding a missing required skill never lowers the score), relevance ordering (a relevant fixture resume outscores an irrelevant one for the same JD), fresher renormalisation (no experience does not zero the experience component).
- PDF edge cases: not a PDF, wrong extension with PDF bytes, encrypted, zero pages, 9+ pages, 6 MB, scanned, two-column, ligature-heavy, empty.
- `ruff`, `mypy --strict` clean. No secrets in repo (run a secret scan).

## Frontend
- `tsc --noEmit`, ESLint clean, Vitest for reducers, parsers and formatters.
- Playwright e2e: upload, custom JD flow, role flow, streaming results, section retry, error states, keyboard-only path, reduced-motion path, 390px viewport.
- axe: zero serious or critical issues on every route.
- Lighthouse (mobile, throttled): Performance >= 90, Accessibility 100, Best Practices >= 95. LCP < 2.2s, CLS < 0.05, INP < 200ms. Initial JS <= 180 KB gzip excluding the lazy 3D chunk.

## Security and privacy
- Upload validation tests, CORS test, rate-limit test, prompt-injection fixtures.
- Verify by test that no resume text appears in logs and no file is written to disk during analysis.
- `docs/privacy.md` and the in-app privacy page describe exactly what is sent to Gemini and what is retained (nothing). Verify current Gemini API data-use terms before writing that sentence and cite the page you checked.

## Content
- `scripts.verify_resources` passes: every catalog URL responds with a success status and the page title still matches. Output a report with timestamps.

## Evidence to attach
Test summaries, Lighthouse reports, axe output, and screenshots at 390 / 768 / 1440 px.

