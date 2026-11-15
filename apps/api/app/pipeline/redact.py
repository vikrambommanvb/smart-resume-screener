import re
from dataclasses import dataclass

EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\b\d{10}\b"
)
URL_REGEX = re.compile(r"https?://\S+|www\.\S+|\b[a-zA-Z0-9-]+\.(?:com|org|net|io|dev|app|ai|tech|co)\b(?:/\S*)?")
ADDRESS_REGEX = re.compile(
    r"\b\d{1,5}\s+[A-Za-z0-9\s.,#-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir)\b",
    re.IGNORECASE,
)


@dataclass
class RedactionResult:
    redacted_text: str
    has_email: bool
    has_phone: bool
    has_linkedin: bool
    has_github: bool
    has_portfolio: bool
    candidate_name: str = ""


def redact_pii(text: str) -> RedactionResult:
    """Masks candidate PII while tracking presence flags for resume health scoring."""
    has_email = bool(EMAIL_REGEX.search(text))
    has_phone = bool(PHONE_REGEX.search(text))
    has_linkedin = "linkedin.com" in text.lower() or "linkedin" in text.lower()
    has_github = "github.com" in text.lower() or "github" in text.lower()
    has_portfolio = bool(
        re.search(r"\b(?:portfolio|personal website|github\.io|vercel\.app)\b|\b[a-zA-Z0-9-]+\.(?:dev|me|io)\b", text, re.IGNORECASE)
    )

    # 1. Mask Emails first so domain is not swallowed by URL regex
    redacted = EMAIL_REGEX.sub("[EMAIL]", text)

    # 2. Mask Phone numbers
    redacted = PHONE_REGEX.sub("[PHONE]", redacted)

    # 3. Mask URLs and Links
    redacted = URL_REGEX.sub("[LINK]", redacted)

    # 4. Mask Physical Addresses
    redacted = ADDRESS_REGEX.sub("[LOCATION]", redacted)

    # 5. Candidate Name Detection in header region (first 3-4 lines before section headers)
    lines = redacted.splitlines()
    detected_name = ""
    if lines:
        for i in range(min(4, len(lines))):
            cand = lines[i].strip()
            # If line is short (2 to 4 words), letters only, and contains no special markers
            words = cand.split()
            if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
                lower_cand = cand.lower()
                if not any(header in lower_cand for header in ["resume", "curriculum", "cv", "summary", "engineer", "developer"]):
                    detected_name = cand
                    lines[i] = "[NAME]"
                    break

    redacted = "\n".join(lines)

    return RedactionResult(
        redacted_text=redacted,
        has_email=has_email,
        has_phone=has_phone,
        has_linkedin=has_linkedin,
        has_github=has_github,
        has_portfolio=has_portfolio,
        candidate_name=detected_name,
    )
