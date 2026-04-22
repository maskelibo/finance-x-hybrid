"""Finance-X Document Intelligence — PDF corpus → Qdrant RAG."""
from .embedding import EmbeddingProvider, get_default_embedder
from .ingest import ingest_pdf, ensure_collection, get_qdrant_client, DocumentChunk
from .retriever import retrieve, RetrievedChunk
from .cited_rag import query_company_knowledge, EvidencePack

__all__ = [
    "EmbeddingProvider",
    "get_default_embedder",
    "ingest_pdf",
    "ensure_collection",
    "get_qdrant_client",
    "DocumentChunk",
    "retrieve",
    "RetrievedChunk",
    "query_company_knowledge",
    "EvidencePack",
]
