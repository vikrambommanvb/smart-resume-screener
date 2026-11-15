import re

from rapidfuzz import fuzz

URL_REGEX = re.compile(r"https?://\S+|www\.\S+|\b[a-zA-Z0-9-]+\.(?:com|org|net|io|dev|app|ai|tech|co)\b(?:/\S*)?")
BRACKETED_PLACEHOLDER_REGEX = re.compile(r"\[[A-Za-z0-9_%+-]+\]")
DIGIT_TOKEN_REGEX = re.compile(r"\b\d+(?:[.,]\d+)?%?\b")


def verify_evidence_quote(quote: str, source_text: str, threshold: float = 88.0) -> bool:
    """Verifies that an evidence quote exists in the source text using RapidFuzz partial_ratio >= 88."""
    if not quote or not source_text:
        return False

    q_clean = quote.strip().lower()
    src_clean = source_text.strip().lower()

    if len(q_clean) < 10:
        return False

    # Exact substring check
    if q_clean in src_clean:
        return True

    # Fuzzy partial ratio
    score = fuzz.partial_ratio(q_clean, src_clean)
    return score >= threshold


def check_no_invented_numbers(original: str, suggested: str) -> bool:
    """Rejects suggested rewrites if they introduce numbers not in original or bracketed placeholders.
    Every digit-bearing token in 'suggested' must:
    1. Exist in 'original', OR
    2. Be enclosed in square brackets as a placeholder (e.g. '[X%]', '[N] users').
    """
    if not suggested:
        return True

    # 1. Mask valid bracketed placeholders from suggested text
    masked_suggested = BRACKETED_PLACEHOLDER_REGEX.sub("", suggested)

    # 2. Extract remaining numeric tokens in suggested
    suggested_nums = set(DIGIT_TOKEN_REGEX.findall(masked_suggested))
    if not suggested_nums:
        return True

    # 3. Extract numeric tokens from original
    original_nums = set(DIGIT_TOKEN_REGEX.findall(original))

    # All unmasked numbers in suggested must exist in original
    for num in suggested_nums:
        # Check raw digits
        digits_only = re.sub(r"[^\d]", "", num)
        orig_digits = {re.sub(r"[^\d]", "", o) for o in original_nums}
        if digits_only not in orig_digits:
            # Found an ungrounded, unbracketed invented number
            return False

    return True


def strip_model_urls(text: str) -> str:
    """Strips any hallucinated or generated URLs from model text. URLs come only from verified catalogs."""
    return URL_REGEX.sub("[RESOURCE]", text)


def filter_catalog_ids(ids: list[str], valid_catalog: set[str]) -> list[str]:
    """Retains only IDs that strictly exist in the server-side catalog."""
    return [item for item in ids if item in valid_catalog]
