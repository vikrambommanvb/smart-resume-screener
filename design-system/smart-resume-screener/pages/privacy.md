# Page Specification: Privacy Architecture & Data Protection

**Route:** `/privacy`  
**Layout Mode:** Single-column editorial disclosure with structured technical cards  
**Primary Focus:** Uncompromising transparency regarding data retention, memory boundaries, and PII protection  
**Associated Components:** `PrivacyPage.tsx`  

---

## 1. Page Header & Editorial Stance

The Privacy page is structured as an architectural disclosure rather than standard legal fine print.

- **Return Navigation:**
  - `← Return to screener` button (`text-sm font-medium hover:text-ink px-3.5 py-2 bg-paper-2 border border-rule/80 rounded-lg`).
- **Header Lockup:**
  - Badge: "Privacy architecture" in brand violet.
  - Footprint Indicator: "0 KB persistent footprint" in Atkinson Mono.
  - Heading: "Privacy and data protection architecture" (`text-4xl sm:text-5xl font-display font-medium text-ink`).
  - Core Claim: "Privacy is engineered directly into our execution flow through strict zero retention."

---

## 2. Four-Stage Ephemeral Lifecycle

A horizontal/grid lifecycle diagram showing the exact trajectory of user data:

```
[Stage 1: Memory Stream] ──> [Stage 2: PII Redaction] ──> [Stage 3: Local Eval] ──> [Stage 4: Ephemeral Release]
```

1. **Stage 1: In-Memory Reception:**
   PDF bytes stream directly into volatile memory buffers (`io.BytesIO`). No temporary files or scratch writes occur on disk.
2. **Stage 2: PII Sanitization:**
   Names, email addresses, telephone numbers, and street addresses are scrubbed using regex and entity extraction prior to NLP or model inference.
3. **Stage 3: Deterministic Scoring:**
   Skills and experiences are evaluated against static mathematical weights. No training data collection or cross-user model fine-tuning.
4. **Stage 4: Ephemeral Release:**
   When the HTTP response or SSE stream finishes, memory buffers are garbage-collected immediately. Nothing is written to any database.

---

## 3. Seven Technical Sections

The disclosure is organized into 7 comprehensive technical cards:

1. **Zero-Retention Guarantee:**
   Explicit guarantee that resumes, parsed text, and scores are never stored on hard disk drives, databases, or cloud buckets.
2. **PII Redaction Architecture:**
   Technical description of regex patterns and redaction filters that sanitize personally identifiable information.
3. **In-Memory Processing:**
   Explanation of volatile RAM execution with immediate OS buffer deallocation.
4. **Zero Third-Party Trackers:**
   No Google Analytics, Meta Pixels, Mixpanel, Segment, or session-recording trackers. Zero advertising telemetry cookies.
5. **Deterministic Evaluation Engine:**
   Scoring logic is open, mathematically defined, and consistent. Two candidates with identical resumes and job benchmarks receive the exact same score.
6. **No AI Retraining:**
   Uploaded resume data is never shared with model providers for foundation model training, reinforcement learning, or fine-tuning.
7. **Client-Side Verification:**
   Candidates can verify zero network egress outside the direct API endpoints using browser developer tools.
