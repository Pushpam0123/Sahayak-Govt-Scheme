import hashlib
import logging
import os
import random
from abc import ABC, abstractmethod

import voyageai

logger = logging.getLogger("sahayak.ingest.embedder")


class Embedder(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        pass

    @abstractmethod
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        pass


class VoyageEmbedder(Embedder):
    def __init__(self, api_key: str | None = None):
        key = api_key or os.getenv("VOYAGE_API_KEY")
        if not key:
            raise ValueError(
                "Voyage API Key is missing. Set VOYAGE_API_KEY environment variable."
            )
        self.client = voyageai.Client(api_key=key)  # type: ignore
        self.model = "voyage-3.5"
        logger.info(f"Initialized VoyageEmbedder using model '{self.model}'")

    def embed_text(self, text: str) -> list[float]:
        # Clean text
        cleaned = text.replace("\n", " ")
        result = self.client.embed([cleaned], model=self.model)
        return list(result.embeddings[0])

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        cleaned = [t.replace("\n", " ") for t in texts]
        batch_size = 128
        embeddings: list[list[float]] = []
        for i in range(0, len(cleaned), batch_size):
            batch = cleaned[i : i + batch_size]
            result = self.client.embed(batch, model=self.model)
            embeddings.extend(result.embeddings)  # type: ignore
        return embeddings


class MockEmbedder(Embedder):
    """Deterministic mock embedder generating 1024-dim vectors based on text hash
    with simple keyword-based semantic overlap to allow offline retrieval evaluation.
    """

    def __init__(self) -> None:
        self.dimension = 1024
        logger.info(
            f"Initialized MockEmbedder generating {self.dimension}-dimensional vectors"
        )

        # Map schemes to indices (dimensions 0 to 19)
        self.schemes = [
            ("pm-kisan", ["pm-kisan", "kisan", "किसान"]),
            ("pm-jay", ["pm-jay", "ayushman", "jan arogya", "आरोग्य"]),
            ("pmay-g", ["pmay-g", "awas", "housing", "आवास"]),
            (
                "nsp-post-matric",
                ["nsp-post-matric", "post-matric", "scholarship", "छात्रवृत्ति"],
            ),
            ("pm-svanidhi", ["pm-svanidhi", "svanidhi", "street vendor", "स्वनिधि"]),
            (
                "atal-pension-yojana",
                ["atal-pension-yojana", "atal pension", "apy", "अटल पेंशन"],
            ),
            (
                "pm-matru-vandana",
                ["pm-matru-vandana", "matru vandana", "pmmvy", "मातृ वंदना"],
            ),
            ("pm-jjby", ["pm-jjby", "jeevan jyoti", "जीवन ज्योति"]),
            ("pm-sby", ["pm-sby", "suraksha bima", "सुरक्षा बीमा"]),
            ("stand-up-india", ["stand-up-india", "stand up", "स्टैंड अप"]),
            (
                "pm-fby",
                ["pm-fby", "fasal bima", "operation guidelines", "फसल बीमा"],
            ),
            ("mid-day-meal", ["mid-day-meal", "mid day", "poshan", "मिड डे मील"]),
            ("mp-ladli-behna", ["mp-ladli-behna", "ladli behna", "लाडली बहना"]),
            ("ts-rythu-bandhu", ["ts-rythu-bandhu", "rythu bandhu", "ऋतु बंधु"]),
            ("wb-kanyashree", ["wb-kanyashree", "kanyashree", "कन्याश्री"]),
            (
                "ap-ysr-cheyutha",
                ["ap-ysr-cheyutha", "ysr cheyutha", "cheyutha", "चेयुथा"],
            ),
            ("odisha-kalia", ["odisha-kalia", "kalia", "कालिया"]),
            ("ka-gruha-jyothi", ["ka-gruha-jyothi", "gruha jyothi", "गृह ज्योति"]),
            (
                "mh-shravan-bal",
                ["mh-shravan-bal", "shravan bal", "shravanbal", "श्रवण बाल"],
            ),
            (
                "bihar-student-credit-card",
                ["bihar-student-credit-card", "student credit card", "बिहार छात्र"],
            ),
        ]

        # Map concepts to indices (dimensions 100 to 102)
        self.concepts = [
            (
                "eligibility",
                [
                    "eligibility",
                    "eligible",
                    "qualify",
                    "criteria",
                    "पात्र",
                    "पात्रता",
                ],
            ),
            (
                "benefits",
                [
                    "benefit",
                    "assistance",
                    "₹6,000",
                    "annum",
                    "सहायता",
                    "वित्तीय",
                    "राशि",
                ],
            ),
            ("exclusion", ["exclude", "exclusion", "excluded", "अपवर्जन", "बाहर"]),
        ]

    def _get_vector(self, text: str) -> list[float]:
        text_lower = text.lower()

        # Start with base noise determined by text hash
        hash_val = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16)
        rng = random.Random(hash_val % (2**32))
        vector = [rng.uniform(-0.1, 0.1) for _ in range(self.dimension)]

        # Set scheme components
        for idx, (scheme_id, keywords) in enumerate(self.schemes):
            if any(kw in text_lower for kw in keywords):
                vector[idx] = 1.0

        # Set concept components
        for idx, (concept, keywords) in enumerate(self.concepts):
            if any(kw in text_lower for kw in keywords):
                vector[100 + idx] = 1.0

        # Normalize to unit vector
        magnitude = sum(x * x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        return vector

    def embed_text(self, text: str) -> list[float]:
        return self._get_vector(text)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self._get_vector(text) for text in texts]


def get_embedder() -> Embedder:
    """Returns VoyageEmbedder if VOYAGE_API_KEY is configured, else falls back to MockEmbedder."""
    api_key = os.getenv("VOYAGE_API_KEY")
    if api_key and api_key != "your-voyage-api-key-here" and api_key.strip():
        try:
            return VoyageEmbedder(api_key)
        except Exception as e:
            logger.error(
                f"Failed to initialize VoyageEmbedder: {str(e)}. Falling back to MockEmbedder."
            )
            return MockEmbedder()
    else:
        logger.warning(
            "VOYAGE_API_KEY not configured or placeholder. Falling back to MockEmbedder."
        )
        return MockEmbedder()
