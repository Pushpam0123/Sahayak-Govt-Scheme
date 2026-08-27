import os

import pytest

from ingest.chunker import chunk_document
from ingest.cleaner import clean_html_content
from ingest.embedder import MockEmbedder

FIXTURE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "fixtures",
    "sample.html"
)

def test_html_cleaning() -> None:
    # Load fixture
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    cleaned_text = clean_html_content(content)

    # Assertions on text structure
    assert "# Pradhan Mantri Test Scheme" in cleaned_text
    assert "## 1. Eligibility" in cleaned_text

    # Assertions on Markdown table format
    assert "| Criteria | Limit |" in cleaned_text
    assert "| --- | --- |" in cleaned_text
    assert "| Age | >= 18 |" in cleaned_text
    assert "| Income | <= 200000 |" in cleaned_text

def test_chunking() -> None:
    # Prepare text
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    cleaned_text = clean_html_content(content)
    chunks = chunk_document(cleaned_text, "PM-Test-Scheme", target_min_tokens=10, target_max_tokens=150)

    assert len(chunks) > 0

    # Check headers
    first_chunk = chunks[0]
    assert "seq" in first_chunk
    assert "heading_path" in first_chunk
    assert "text" in first_chunk
    assert "tokens" in first_chunk

    # Ensure headings map hierarchical path
    assert "PM-Test-Scheme" in first_chunk["heading_path"]

    # Verify table integrity is preserved in a chunk
    table_chunk = None
    for chunk in chunks:
        if "| Age |" in chunk["text"]:
            table_chunk = chunk
            break

    assert table_chunk is not None
    # A single chunk should contain the entire table, not split across cells
    assert "| Criteria | Limit |" in table_chunk["text"]
    assert "| Income | <= 200000 |" in table_chunk["text"]

def test_mock_embedder() -> None:
    embedder = MockEmbedder()

    t1 = "This is a test document."
    t2 = "This is a test document."
    t3 = "Different text content."

    v1 = embedder.embed_text(t1)
    v2 = embedder.embed_text(t2)
    v3 = embedder.embed_text(t3)

    # Check dimensionality
    assert len(v1) == 1024
    assert len(v3) == 1024

    # Check determinism (same text -> same vector)
    assert v1 == v2

    # Check variance (different text -> different vector)
    assert v1 != v3

    # Check normalization (magnitude of unit vector is ~1.0)
    mag = sum(x*x for x in v1) ** 0.5
    assert pytest.approx(mag, 0.001) == 1.0
