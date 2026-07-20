import os
import hashlib
import random
import logging
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
            raise ValueError("Voyage API Key is missing. Set VOYAGE_API_KEY environment variable.")
        self.client = voyageai.Client(api_key=key)
        self.model = "voyage-3.5"
        logger.info(f"Initialized VoyageEmbedder using model '{self.model}'")

    def embed_text(self, text: str) -> list[float]:
        # Clean text
        cleaned = text.replace("\n", " ")
        result = self.client.embed([cleaned], model=self.model)
        return result.embeddings[0]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        cleaned = [t.replace("\n", " ") for t in texts]
        # Voyage handles batching internally, but let's call in batches of 128 to be safe
        batch_size = 128
        embeddings = []
        for i in range(0, len(cleaned), batch_size):
            batch = cleaned[i : i + batch_size]
            result = self.client.embed(batch, model=self.model)
            embeddings.extend(result.embeddings)
        return embeddings


class MockEmbedder(Embedder):
    """Deterministic mock embedder generating 1024-dim vectors based on text hash."""
    def __init__(self):
        self.dimension = 1024
        logger.info(f"Initialized MockEmbedder generating {self.dimension}-dimensional vectors")

    def _get_vector(self, text: str) -> list[float]:
        # Hash text to get a seed
        hash_val = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16)
        rng = random.Random(hash_val % (2**32))
        
        # Generate 1024 random floats normalized to unit length
        vector = [rng.uniform(-1, 1) for _ in range(self.dimension)]
        magnitude = sum(x*x for x in vector) ** 0.5
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
            logger.error(f"Failed to initialize VoyageEmbedder: {str(e)}. Falling back to MockEmbedder.")
            return MockEmbedder()
    else:
        logger.warning("VOYAGE_API_KEY not configured or placeholder. Falling back to MockEmbedder.")
        return MockEmbedder()
