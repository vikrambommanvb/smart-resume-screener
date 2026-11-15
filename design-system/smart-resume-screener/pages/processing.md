# Page Specification: Processing View & Real-Time Stream

**Route:** `/` (Transient state `status === "analyzing"`)  
**Interaction Model:** Non-blocking Server-Sent Events (SSE) stream with live milestone tracking  
**Primary Focus:** Reassurance, transparency, and deterministic progress feedback  
**Associated Components:** `AnalysisDashboard.tsx`, `api-client.ts` (`streamAnalysis`)  

---

## 1. Visual Architecture & Focal Composition

When the user submits a resume for analysis, the workbench smoothly fades out, replaced by a focused, centered analytical cockpit:

- **Viewport Centering:** Positioned with generous vertical breathing room (`py-16 sm:py-24 max-w-2xl mx-auto`).
- **Surface Elevation:** Encapsulated in a central analytical panel (`bg-paper-2 border border-rule/80 rounded-3xl p-8 sm:p-12 shadow-2xl`).
- **Header Lockup:**
  - Active stage indicator in display typeface (`text-2xl sm:text-3xl font-display font-medium text-ink text-center`).
  - Dynamic subtitle communicating the exact computational task underway.

---

## 2. Five-Stage Linear Progress Timeline

The pipeline breaks into 5 sequential, deterministic milestones:

```
[1. Read]  ──>  [2. Understand]  ──>  [3. Match]  ──>  [4. Health]  ──>  [5. Guidance]
```

### Stage Specifications

| Step Index | Stage Name | Technical Action | Event Identifier | Visual State |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Read Document** | Ephemeral PDF byte extraction and text normalisation via PyMuPDF. | `pdf_parsed` | Icon: FileText |
| **02** | **Sanitize & Understand** | Redacting PII (names, emails, phones) and sectioning resume content. | `pii_redacted` | Icon: ShieldCheck |
| **03** | **Evaluate Alignment** | Deterministic skill matching against curated taxonomy weights. | `match_complete` | Icon: Cpu |
| **04** | **Audit Resume Health** | Structural analysis for ATS parser compliance and action verbs. | `health_complete` | Icon: Activity |
| **05** | **Generate Guidance** | Synthesis of interview prep, bullet rewrites, and career pathways. | `guidance_ready` | Icon: Compass |

### Visual Indicators per State:
- **Pending:** Dimmed indicator (`bg-paper-3 text-muted border border-rule`).
- **Active / Running:** Glowing accent pulse (`border-violet bg-violet-soft text-violet ring-4 ring-violet/20 animate-pulse`).
- **Completed:** Crisp checkmark badge (`bg-ok-soft text-ok border border-ok/40`).

---

## 3. Streaming Lifecycle & Network Fallbacks

- **Server-Sent Events (SSE):**
  - Connected to `/api/v1/analyze/stream`.
  - Parses real-time events (`stage_start`, `stage_update`, `stage_complete`, `final_result`).
- **Degraded Fallback Mode:**
  - If the Gemini generative AI service times out or hits quota limits, the SSE connection emits a `degraded_mode` event.
  - The UI updates gracefully without crashing, falling back to deterministic algorithmic scoring and surfacing an informative banner.
- **Cancellation Trigger:**
  - Accessible "Cancel analysis" button (`h-10 px-4 text-xs font-medium text-ink-2 hover:text-bad border border-rule hover:border-bad/40 rounded-lg`).
  - Aborts the active `AbortController` signal, resets local state, and returns candidate safely to the workbench.
