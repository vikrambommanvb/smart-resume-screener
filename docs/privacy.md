# Privacy by Design Architecture

## 1. Zero-Storage Policy
Smart Resume Screener operates on a strict zero-retention guarantee:
- **No Database:** The application has no relational database, NoSQL store, or object storage bucket attached.
- **No Disk Writes:** Uploaded PDF files and extracted text are processed exclusively in RAM and garbage-collected once the streaming response completes.
- **No PII Logging:** Request logs record only random request IDs, payload sizes, processing durations, stage completions, and error codes. Resume text and job description contents are never written to server logs or monitoring services.

## 2. PII Scrubbing
Before sending any text to the Gemini API for qualitative insights (strengths, rewrite suggestions, interview questions):
- Candidate names detected in header blocks are masked with `[NAME]`.
- Email addresses are scrubbed with `[EMAIL]`.
- Phone numbers are scrubbed with `[PHONE]`.
- Street addresses and postal codes are scrubbed with `[LOCATION]`.
- Personal website and social media URLs are scrubbed with `[LINK]`.
- The health score records the presence or absence of these elements as binary boolean flags without retaining the values.

## 3. Third-Party Processing (Google Gemini API)
- The application interfaces with the Google Gemini API using API keys through `google-genai`.
- In accordance with Google Cloud's API terms of service for paid/standard developer tiers, data sent through standard API endpoints is not used to train or improve Google's models.
- When the user selects "Scanned Document Fallback" for PDFs lacking selectable text, the user is explicitly informed before submission that the document will be processed via optical AI parsing.

