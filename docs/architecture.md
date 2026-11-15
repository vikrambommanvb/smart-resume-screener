# Smart Resume Screener: Architecture Specification

## 1. System Topology

```
+----------------------------------------------------------------+
|                     Client Browser (React 19)                  |
|  - Dropzone & Configuration (JD text or Role ID)               |
|  - SSE Stream Consumer (ReadableStream, Zod payload validation)|
|  - Dual-mode Visualisation (Static SVG / Lazy R3F Canvas)      |
+-------------------------------+--------------------------------+
                                |
                                | POST /api/v1/analyze (multipart)
                                | Accept: text/event-stream
                                v
+-------------------------------+--------------------------------+
|                FastAPI NLP Backend (Cloud Run)                 |
|                                                                |
|  1. Request Validation (5MB limit, PDF magic bytes, CORS)      |
|  2. PyMuPDF In-Memory Extraction & Column-Aware Sorting        |
|  3. PII Masking (Regex & Named Entity Normalisation)           |
|  4. Structural Sectioning (Fuzzy heading classifier)           |
|  5. Taxonomy & Embeddings Match (all-MiniLM-L6-v2)             |
|  6. Deterministic Match Score (0-100) & Health (100 pts)       |
|  7. Guarded Gemini Structured Calls (google-genai SDK)         |
|  8. Evidence & Invented-Number Verification (RapidFuzz)        |
|  9. Resource Attachment from Verified JSON Catalog             |
+----------------------------------------------------------------+
```

## 2. Event-Stream Protocol (`POST /api/v1/analyze`)

The API streams Server-Sent Events (`text/event-stream`) with `Cache-Control: no-store` and `X-Accel-Buffering: no`.

### Event Types:

1. `event: stage`
   ```json
   { "id": "read", "label": "Extracting resume text", "status": "running" }
   ```
   Stages: `read` -> `understand` -> `match` -> `health` -> `guidance`.

2. `event: section`
   Emits progressive analysis payloads:
   - `resume_profile`: Extracted titles, skills with evidence, projects, certifications.
   - `skills`: Matched, partial, and missing skills with importance and category.
   - `match`: Numerical 0-100 score, component breakdown, confidence rating, biggest score movers.
   - `health`: 100-pt ATS & quality score with specific actionable findings.
   - `strengths`: Verified grounded strengths with exact resume quotes.
   - `improvements`: Side-by-side original and suggested rewrites with user placeholders.
   - `careers`: Alternative career role fits with rationales.
   - `roadmap`: Milestone-driven timeline of steps and attached catalog resources.
   - `resources`: Verified learning courses and videos.
   - `interview`: Grounded technical, behavioral, and project-specific questions.

3. `event: error`
   ```json
   { "section": "interview", "code": "LLM_TIMEOUT", "message": "Interview generation timed out.", "retryable": true }
   ```

4. `event: done`
   ```json
   { "request_id": "req_84f92a", "duration_ms": 4820, "degraded": false }
   ```

## 3. Reliability and Fail-Safe Mechanisms

- **Connection Heartbeats:** A comment heartbeat (`: heartbeat\n\n`) is emitted every 10 seconds to maintain open connections across intermediate gateways.
- **Degraded Fallback:** If the Gemini API returns errors or times out, the stream completes with `degraded: true`. All deterministic sections (`match`, `skills`, `health`) remain complete and accurate.
- **Cancellation:** The browser's `AbortController` triggers immediate teardown of background tasks on the server to save computational resources.

