import logging
from typing import Any

from api.services.chat import parse_citations_for_sentence, split_into_sentences


def test_split_into_sentences() -> None:
    # Test simple English sentences with citations
    text = (
        "Candidates must be a resident of India [1]. "
        "They must also belong to the Pension sector [2][3]."
    )
    sentences = split_into_sentences(text)
    assert len(sentences) == 2
    assert sentences[0] == "Candidates must be a resident of India [1]."
    assert sentences[1] == "They must also belong to the Pension sector [2][3]."

    # Test Hindi sentences with citations and Hindi sentence markers (।)
    hindi_text = (
        "उम्मीदवार भारत का निवासी होना चाहिए [1]। "
        "वह कल्याणकारी क्षेत्र से संबंधित होना चाहिए [2]।"
    )
    hindi_sentences = split_into_sentences(hindi_text)
    assert len(hindi_sentences) == 2
    assert (
        hindi_sentences[0]
        == "उम्मीदवार भारत का निवासी होना चाहिए [1]।"
    )
    assert (
        hindi_sentences[1]
        == "वह कल्याणकारी क्षेत्र से संबंधित होना चाहिए [2]।"
    )

    # Test text with newlines
    newline_text = "First sentence [1].\nSecond sentence [2]."
    sentences = split_into_sentences(newline_text)
    assert len(sentences) == 2
    assert sentences[0] == "First sentence [1]."
    assert sentences[1] == "Second sentence [2]."


def test_parse_citations_for_sentence(caplog: Any) -> None:
    # Normal in-bounds citations
    sentence = "Eligibility rules require resident status [1][2]."
    citations = parse_citations_for_sentence(sentence, max_chunk_index=5)
    assert citations == [1, 2]

    # De-duplicates citations
    dup_sentence = "Resident status check [2][2][1]."
    dup_citations = parse_citations_for_sentence(
        dup_sentence, max_chunk_index=5
    )
    assert dup_citations == [1, 2]

    # Out-of-bounds citations (dropped and logged)
    oob_sentence = "Incorrect citation num [6]."
    with caplog.at_level(logging.WARNING):
        oob_citations = parse_citations_for_sentence(
            oob_sentence, max_chunk_index=5
        )
    assert oob_citations == []
    assert "Drop out-of-bounds citation [6]" in caplog.text
