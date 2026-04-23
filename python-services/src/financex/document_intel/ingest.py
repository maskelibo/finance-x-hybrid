"""
PDF → chunks → embeddings → Qdrant.
Metadata-rich: ticker, doc_id, doc_type, fiscal_period, page, section.
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import fitz  # PyMuPDF
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchValue,
    PointStruct,
    VectorParams,
)

from .embedding import EmbeddingProvider, get_default_embedder


@dataclass
class DocumentChunk:
    chunk_id: str
    ticker: str
    doc_id: str
    doc_type: str
    fiscal_period: str
    page_number: int
    section: Optional[str]
    text: str
    source_url: Optional[str] = None


def collection_name(ticker: str) -> str:
    return f"finance_x__{ticker.upper()}"


def get_qdrant_client(url: str = "http://localhost:6333") -> QdrantClient:
    return QdrantClient(url=url)


def ensure_collection(client: QdrantClient, ticker: str, vector_size: int):
    coll = collection_name(ticker)
    existing = [c.name for c in client.get_collections().collections]
    if coll not in existing:
        client.create_collection(
            collection_name=coll,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )


def _sliding_chunks(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Simple sentence-boundary chunker (no llama-index dependency)."""
    if len(text) <= chunk_size:
        return [text]
    # Split by sentence-ish boundaries (Turkish: . ! ? ;\n)
    sentences = re.split(r"(?<=[.!?])\s+|\n\n", text)
    chunks, cur = [], ""
    for sent in sentences:
        if not sent.strip():
            continue
        if len(cur) + len(sent) + 1 <= chunk_size:
            cur = (cur + " " + sent).strip()
        else:
            if cur:
                chunks.append(cur)
            # overlap carry-over
            if overlap > 0 and len(cur) > overlap:
                cur = cur[-overlap:] + " " + sent
            else:
                cur = sent
    if cur:
        chunks.append(cur)
    return chunks


def _detect_section(text: str) -> Optional[str]:
    for line in text.split("\n")[:6]:
        line = line.strip()
        if not line or len(line) > 120:
            continue
        if line.isupper() and 5 < len(line) < 80:
            return line
        # numbered/lettered heading: "1. ..." / "III. ..." / "A. ..."
        if re.match(r"^[IVX]{1,4}\.\s+.+", line) or re.match(r"^\d{1,2}\.\s+.+", line):
            return line[:80]
    return None


def parse_pdf(
    pdf_path: Path,
    ticker: str,
    doc_id: str,
    doc_type: str,
    fiscal_period: str,
) -> Iterable[DocumentChunk]:
    doc = fitz.open(pdf_path)
    try:
        for page_num, page in enumerate(doc, start=1):
            page_text = page.get_text().strip()
            if len(page_text) < 50:
                continue
            section = _detect_section(page_text)
            for i, ch in enumerate(_sliding_chunks(page_text)):
                chunk_id = hashlib.sha256(f"{doc_id}|{page_num}|{i}|{ch[:64]}".encode()).hexdigest()
                # Qdrant point id: hash → 128-bit hex (stable uuid-like)
                point_id = chunk_id[:32]
                yield DocumentChunk(
                    chunk_id=point_id,
                    ticker=ticker,
                    doc_id=doc_id,
                    doc_type=doc_type,
                    fiscal_period=fiscal_period,
                    page_number=page_num,
                    section=section,
                    text=ch,
                )
    finally:
        doc.close()


def ingest_pdf(
    pdf_path: Path,
    ticker: str,
    doc_id: str,
    doc_type: str,
    fiscal_period: str,
    qdrant_url: str = "http://localhost:6333",
    embedder: Optional[EmbeddingProvider] = None,
) -> dict:
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        return {"status": "error", "error": f"pdf not found: {pdf_path}"}

    embedder = embedder or get_default_embedder()
    client = get_qdrant_client(qdrant_url)
    ensure_collection(client, ticker, vector_size=embedder.dim)

    # Idempotency: drop any prior points with this doc_id before upserting.
    # Protects against doc_id reuse with changed text or prior runs with
    # different point-id derivation.
    client.delete(
        collection_name=collection_name(ticker),
        points_selector=FilterSelector(
            filter=Filter(
                must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
            )
        ),
    )

    chunks = list(parse_pdf(pdf_path, ticker, doc_id, doc_type, fiscal_period))
    if not chunks:
        return {"status": "empty", "ticker": ticker, "doc_id": doc_id, "chunks": 0}

    vectors = embedder.embed_batch([c.text for c in chunks])
    # Qdrant accepts string ids; use chunk_id (hex prefix)
    points = [
        PointStruct(
            id=int(c.chunk_id, 16) % (2**63 - 1),  # 64-bit positive int
            vector=vec,
            payload={
                "ticker": c.ticker,
                "doc_id": c.doc_id,
                "doc_type": c.doc_type,
                "fiscal_period": c.fiscal_period,
                "page_number": c.page_number,
                "section": c.section,
                "text": c.text,
            },
        )
        for c, vec in zip(chunks, vectors)
    ]
    client.upsert(collection_name=collection_name(ticker), points=points)

    return {
        "status": "success",
        "ticker": ticker,
        "doc_id": doc_id,
        "chunks": len(chunks),
        "pages": max(c.page_number for c in chunks),
        "embedder": embedder.name,
    }
