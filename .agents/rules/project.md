# Smart Resume Screener: standing rules

Monorepo: `apps/web` (React/Vite), `apps/api` (FastAPI), `docs/`, `.agents/`.

## Always
- Read the relevant skill in `.agents/skills/` before working in its area.
- Strict TypeScript, no `any`. Python fully typed, `ruff` and `mypy` clean.
- Score, health and gap logic is deterministic and unit-tested. Gemini never sets numbers that users see as scores.
- Every resume-derived claim shown to the user needs a verified evidence quote.
- Never log resume or JD text. Never write uploads to disk. Never put URLs from model output in the UI.
- Every user-facing string follows the copy rules in the `distinctive-ui-design` skill.
- Each new UI state needs loading, empty, error and success treatments.

## Never
- Add accounts, databases, analytics that capture content, or third-party trackers.
- Add gradient text, glassmorphism on every surface, identical three-card feature grids, stock illustrations, emojis in UI, or fabricated social proof.
- Commit secrets. Use `.env.example`.

## Commands
- API: `cd apps/api && uv run pytest && uv run ruff check . && uv run mypy .`
- Web: `cd apps/web && pnpm test && pnpm lint && pnpm typecheck && pnpm e2e`
- Link catalog check: `cd apps/api && uv run python -m scripts.verify_resources`

## Definition of done for any task
Tests pass, types pass, screenshots reviewed at 390 / 768 / 1440 px, keyboard path works, reduced-motion path works.

