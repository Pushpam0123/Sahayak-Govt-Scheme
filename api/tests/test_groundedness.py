import pytest

from api.models.scheme import Chunk
from api.services.groundedness import verify_groundedness


@pytest.mark.asyncio
async def test_verify_groundedness_supported() -> None:
    # Set up dummy input
    sentences = [
        {"text": "Candidates must be resident of India [1].", "citations": [1]}
    ]
    chunks = [
        Chunk(
            id=1,
            document_id=10,
            seq=1,
            heading_path="Eligibility",
            text="Candidates must be resident of India.",
            tokens=10,
        )
    ]

    # Run check
    results = await verify_groundedness(sentences, chunks)
    assert len(results) == 1
    assert results[0]["status"] == "supported"
    assert "Grounded" in results[0]["reasoning"]


@pytest.mark.asyncio
async def test_verify_groundedness_unsupported_regression() -> None:
    # Set up dummy input with deliberately bad citation keyword
    sentences = [
        {"text": "This has a deliberately bad citation [1].", "citations": [1]}
    ]
    chunks = [
        Chunk(
            id=1,
            document_id=10,
            seq=1,
            heading_path="Eligibility",
            text="Candidates must be resident of India.",
            tokens=10,
        )
    ]

    # Run check
    results = await verify_groundedness(sentences, chunks)
    assert len(results) == 1
    assert results[0]["status"] == "unsupported"
    assert "Seeded bad citation" in results[0]["reasoning"]
