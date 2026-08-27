import logging
import re

logger = logging.getLogger("sahayak.ingest.chunker")


def estimate_tokens(text: str) -> int:
    """Estimates token count. Standard proxy: 1 word ~ 1.3 tokens."""
    words = text.split()
    return int(len(words) * 1.3)


def parse_heading(line: str) -> tuple[int, str] | None:
    """Checks if a line is a Markdown heading. Returns (level, text) or None."""
    match = re.match(r"^(#{1,6})\s+(.+)$", line.strip())
    if match:
        level = len(match.group(1))
        title = match.group(2).strip()
        return level, title
    return None


def make_heading_path(headers: list[str]) -> str:
    """Joins headers to create a heading path, e.g., 'Section 1 > Subsection A'."""
    active_headers = [h for h in headers if h]
    return " > ".join(active_headers)


def chunk_document(
    document_text: str,
    scheme_name: str,
    target_min_tokens: int = 400,
    target_max_tokens: int = 800,
) -> list[dict]:
    """
    Splits document text into heading-aware chunks.
    Ensures tables are not split, and metadata contains heading path and token size.
    Returns: list of dicts:
        {'seq': int, 'heading_path': str, 'text': str, 'tokens': int}
    """
    lines = document_text.split("\n")

    chunks = []
    chunk_seq = 1

    current_headers = [""] * 6  # levels 1 to 6
    current_headers[0] = scheme_name  # Seed with scheme name as root

    current_buffer = []
    current_tokens = 0
    in_table = False

    def emit_chunk():
        nonlocal chunk_seq
        if not current_buffer:
            return

        chunk_text = "\n".join(current_buffer).strip()
        if not chunk_text:
            return

        heading_path = make_heading_path(current_headers)
        tokens = estimate_tokens(chunk_text)

        chunks.append(
            {
                "seq": chunk_seq,
                "heading_path": heading_path,
                "text": chunk_text,
                "tokens": tokens,
            }
        )
        chunk_seq += 1

        # Reset buffer
        current_buffer.clear()

    for line in lines:
        stripped_line = line.strip()

        # Check table boundary
        is_table_line = stripped_line.startswith("|")
        if is_table_line:
            in_table = True
        elif in_table and not stripped_line:
            # Empty line after table might mean table ended
            in_table = False

        # Check if heading
        heading_info = parse_heading(line)

        if heading_info and not in_table:
            # We hit a heading. If enough text has accumulated, emit the
            # current chunk first.
            level, title = heading_info

            # Emit if the buffer has content and we hit a major heading
            # (H1, H2, H3) or exceeded the minimum size.
            if current_buffer and (level <= 3 or current_tokens >= target_min_tokens):
                emit_chunk()

            # Update heading path hierarchy
            # Level is 1-indexed, convert to index
            idx = level - 1
            if idx < 6:
                current_headers[idx] = title
                # Clear lower level headings
                for i in range(idx + 1, 6):
                    current_headers[i] = ""

            current_tokens = 0

        # Append line to buffer
        current_buffer.append(line)
        current_tokens = estimate_tokens("\n".join(current_buffer))

        # If the maximum chunk size is exceeded and we are not inside a
        # table, emit the chunk.
        if current_tokens >= target_max_tokens and not in_table:
            emit_chunk()
            current_tokens = 0

    # Emit final remaining buffer
    if current_buffer:
        emit_chunk()

    logger.info(f"Chunked document into {len(chunks)} chunks")
    return chunks
