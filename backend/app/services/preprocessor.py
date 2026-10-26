import re

URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
PUNCT_DIGIT_PATTERN = re.compile(r"[^a-z\s]")
WHITESPACE_PATTERN = re.compile(r"\s+")

def clean_text(headline: str, body_text: str) -> str:
    """
    Cleans headline and body text according to documented NLP pipeline specifications:
    1. Concatenates headline and body text with a space.
    2. Converts to lowercase.
    3. Removes URLs.
    4. Removes digits and punctuation (retains only a-z and whitespace).
    5. Normalizes multiple whitespace characters to a single space and strips boundaries.
    """
    raw = f"{headline or ''} {body_text or ''}".lower()
    no_urls = URL_PATTERN.sub(" ", raw)
    letters_only = PUNCT_DIGIT_PATTERN.sub(" ", no_urls)
    normalized = WHITESPACE_PATTERN.sub(" ", letters_only).strip()
    return normalized

def count_words(text: str) -> int:
    """Counts non-whitespace tokens in text."""
    if not text:
        return 0
    return len(text.strip().split())
