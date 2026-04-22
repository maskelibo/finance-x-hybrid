"""
Hybrid retrieval: vector similarity + BM25 rerank.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from qdrant_client.http.models import FieldCondition, Filter, MatchValue

from .embedding import EmbeddingProvider, get_default_embedder
from .ingest import collection_name, get_qdrant_client


@dataclass
class RetrievedChunk:
    chunk_id: str
    text: str
    score: float
    vector_score: float
    bm25_score: float
    ticker: str
    doc_id: str
    doc_type: str
    fiscal_period: str
    page_number: int
    section: Optional[str]


def _bm25_scores(corpus: List[List[str]], query: List[str]) -> List[float]:
    """Lightweight BM25 without external dep — k1=1.5, b=0.75."""
    if not corpus:
        return []
    N = len(corpus)
    avgdl = sum(len(d) for d in corpus) / max(N, 1)
    # document frequency
    df: dict[str, int] = {}
    for d in corpus:
        for term in set(d):
            df[term] = df.get(term, 0) + 1
    k1, b = 1.5, 0.75
    import math
    scores = []
    for d in corpus:
        score = 0.0
        freq: dict[str, int] = {}
        for t in d:
            freq[t] = freq.get(t, 0) + 1
        dl = len(d)
        for qt in query:
            if qt not in freq:
                continue
            idf = math.log(1 + (N - df.get(qt, 0) + 0.5) / (df.get(qt, 0) + 0.5))
            tf = freq[qt]
            score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgdl))
        scores.append(score)
    return scores


def retrieve(
    ticker: str,
    query: str,
    top_k: int = 10,
    doc_type_filter: Optional[str] = None,
    fiscal_period_filter: Optional[str] = None,
    qdrant_url: str = "http://localhost:6333",
    embedder: Optional[EmbeddingProvider] = None,
) -> List[RetrievedChunk]:
    embedder = embedder or get_default_embedder()
    client = get_qdrant_client(qdrant_url)

    # e5-family query prefix
    from .embedding import LocalE5Embedder
    if isinstance(embedder, LocalE5Embedder):
        from sentence_transformers import SentenceTransformer  # noqa: F401
        # Use "query: " prefix for asymmetric retrieval
        query_vec = embedder._model.encode(f"query: {query}", normalize_embeddings=True).tolist()
    else:
        query_vec = embedder.embed_text(query)

    must = []
    if doc_type_filter:
        must.append(FieldCondition(key="doc_type", match=MatchValue(value=doc_type_filter)))
    if fiscal_period_filter:
        must.append(FieldCondition(key="fiscal_period", match=MatchValue(value=fiscal_period_filter)))
    qf = Filter(must=must) if must else None

    try:
        response = client.query_points(
            collection_name=collection_name(ticker),
            query=query_vec,
            query_filter=qf,
            limit=top_k * 2,
            with_payload=True,
        )
        hits = response.points
    except Exception as exc:
        if "not found" in str(exc).lower() or "404" in str(exc):
            return []
        raise

    if not hits:
        return []

    corpus = [h.payload["text"].lower().split() for h in hits]
    q_tok = query.lower().split()
    bm25 = _bm25_scores(corpus, q_tok)
    max_vec = max(h.score for h in hits) or 1.0
    max_bm25 = max(bm25) if bm25 and max(bm25) > 0 else 1.0

    combined = []
    for h, b in zip(hits, bm25):
        vn = h.score / max_vec
        bn = b / max_bm25
        cs = 0.7 * vn + 0.3 * bn
        combined.append((cs, vn, bn, h))
    combined.sort(key=lambda x: x[0], reverse=True)

    return [
        RetrievedChunk(
            chunk_id=str(h.id),
            text=h.payload["text"],
            score=cs,
            vector_score=vn,
            bm25_score=bn,
            ticker=h.payload["ticker"],
            doc_id=h.payload["doc_id"],
            doc_type=h.payload["doc_type"],
            fiscal_period=h.payload["fiscal_period"],
            page_number=h.payload["page_number"],
            section=h.payload.get("section"),
        )
        for cs, vn, bn, h in combined[:top_k]
    ]
