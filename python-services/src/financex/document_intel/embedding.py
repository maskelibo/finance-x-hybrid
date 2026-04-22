"""
Embedding provider abstraction — pluggable backend.
Default: local sentence-transformers (intfloat/multilingual-e5-small, 384-dim, 118 MB, Turkish-capable).
Optional: OpenAI (text-embedding-3-small, 1536-dim) when OPENAI_API_KEY set and EMBEDDING_PROVIDER=openai.
"""
from __future__ import annotations

import os
from typing import List, Protocol


class EmbeddingProvider(Protocol):
    @property
    def dim(self) -> int: ...
    @property
    def name(self) -> str: ...
    def embed_text(self, text: str) -> List[float]: ...
    def embed_batch(self, texts: List[str]) -> List[List[float]]: ...


class LocalE5Embedder:
    """sentence-transformers local inference. First call downloads ~118 MB model."""

    def __init__(self, model_name: str = "intfloat/multilingual-e5-small"):
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(model_name)
        self._model_name = model_name
        # Probe dimension once
        self._dim = len(self._model.encode("probe", normalize_embeddings=True))

    @property
    def dim(self) -> int:
        return self._dim

    @property
    def name(self) -> str:
        return f"local:{self._model_name}"

    def embed_text(self, text: str) -> List[float]:
        # e5-family wants "query: "/"passage: " prefix; keep passage-style for symmetry
        vec = self._model.encode(f"passage: {text}", normalize_embeddings=True)
        return vec.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        prefixed = [f"passage: {t}" for t in texts]
        mat = self._model.encode(prefixed, normalize_embeddings=True, show_progress_bar=False)
        return [row.tolist() for row in mat]


class OpenAIEmbedder:
    def __init__(self, model: str = "text-embedding-3-small"):
        from openai import OpenAI
        self._client = OpenAI()
        self._model = model
        # OpenAI text-embedding-3-small = 1536 by default
        self._dim = 1536

    @property
    def dim(self) -> int:
        return self._dim

    @property
    def name(self) -> str:
        return f"openai:{self._model}"

    def embed_text(self, text: str) -> List[float]:
        r = self._client.embeddings.create(model=self._model, input=text)
        return r.data[0].embedding

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        r = self._client.embeddings.create(model=self._model, input=texts)
        return [d.embedding for d in r.data]


_cached: EmbeddingProvider | None = None


def get_default_embedder() -> EmbeddingProvider:
    global _cached
    if _cached is not None:
        return _cached
    provider = os.environ.get("EMBEDDING_PROVIDER", "local").lower()
    if provider == "openai" and os.environ.get("OPENAI_API_KEY"):
        _cached = OpenAIEmbedder()
    else:
        _cached = LocalE5Embedder()
    return _cached
