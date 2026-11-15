import re
import unicodedata

BULLET_CHARS = re.compile(r"[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u25A0\u25A1\u25C6\u25C7\u27A2\u27A4\u2013\u2014\*]")
DEHYPHEN_REGEX = re.compile(r"(\b[a-zA-Z]{2,})-\s*\n\s*([a-zA-Z]{2,}\b)")
MULTI_NEWLINES = re.compile(r"\n{3,}")
HORIZONTAL_WHITESPACE = re.compile(r"[^\S\r\n]+")


def normalise_text(raw_text: str) -> str:
    """Normalises raw extracted PDF text using Unicode NFKC, bullet standardisation, and dehyphenation."""
    if not raw_text:
        return ""

    # 1. Unicode NFKC normalisation (unifies ligatures such as fi -> fi, fractions, fullwidth chars)
    text = unicodedata.normalize("NFKC", raw_text)

    # 2. Convert bullet glyphs to uniform dash '-'
    lines = text.splitlines()
    norm_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            norm_lines.append("")
            continue
        # If line starts with a bullet character
        first_char = stripped[0]
        if BULLET_CHARS.match(first_char):
            remainder = stripped[1:].strip()
            norm_lines.append(f"- {remainder}")
        else:
            # Replace internal stray bullet characters
            cleaned_line = BULLET_CHARS.sub("-", line)
            norm_lines.append(cleaned_line)

    text = "\n".join(norm_lines)

    # 3. De-hyphenate word wraps across line breaks (e.g. "concur- \n rency" -> "concurrency")
    text = DEHYPHEN_REGEX.sub(r"\1\2", text)

    # 4. Collapse consecutive horizontal whitespace (tabs, spaces) while preserving newlines
    text = HORIZONTAL_WHITESPACE.sub(" ", text)

    # 5. Collapse excessive vertical blank lines (>2) into clean double newlines
    text = MULTI_NEWLINES.sub("\n\n", text)

    return text.strip()


def strip_repeated_headers_footers(page_texts: list[str]) -> list[str]:
    """Detects and removes repeated header/footer lines occurring across multiple pages."""
    if len(page_texts) <= 1:
        return page_texts

    # Count occurrence of exact lines across pages
    line_page_counts: dict[str, set[int]] = {}
    for p_idx, p_text in enumerate(page_texts):
        for line in p_text.splitlines():
            s = line.strip().lower()
            if len(s) > 3 and not s.startswith("-"):
                line_page_counts.setdefault(s, set()).add(p_idx)

    # Lines appearing in >= 75% of pages are considered running headers/footers
    threshold = max(2, int(len(page_texts) * 0.75))
    repeated_lines = {line for line, pages in line_page_counts.items() if len(pages) >= threshold}

    cleaned_pages: list[str] = []
    for p_text in page_texts:
        filtered = [
            line for line in p_text.splitlines()
            if line.strip().lower() not in repeated_lines
        ]
        cleaned_pages.append("\n".join(filtered))

    return cleaned_pages
