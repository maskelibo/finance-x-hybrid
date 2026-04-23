"""Cited RAG — returns structured evidence pack, no LLM narrative."""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from typing import List, Optional

# Windows cp1254 default breaks on chars like '↗'. Reconfigure stdio to UTF-8
# so JSON output + piping / redirection works regardless of terminal codepage.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    except Exception:
        pass

from .retriever import RetrievedChunk, retrieve


@dataclass
class EvidencePack:
    ticker: str
    query: str
    chunks: List[RetrievedChunk]
    total_retrieved: int

    def to_dict(self) -> dict:
        return {
            "ticker": self.ticker,
            "query": self.query,
            "total_retrieved": self.total_retrieved,
            "evidence": [
                {
                    "doc_id": c.doc_id,
                    "doc_type": c.doc_type,
                    "fiscal_period": c.fiscal_period,
                    "page": c.page_number,
                    "section": c.section,
                    "snippet": c.text[:500],
                    "relevance": round(c.score, 3),
                }
                for c in self.chunks
            ],
        }


def query_company_knowledge(
    ticker: str,
    question: str,
    top_k: int = 5,
    doc_type_filter: Optional[str] = None,
) -> EvidencePack:
    chunks = retrieve(
        ticker=ticker,
        query=question,
        top_k=top_k,
        doc_type_filter=doc_type_filter,
    )
    return EvidencePack(ticker=ticker, query=question, chunks=chunks, total_retrieved=len(chunks))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python -m financex.document_intel.cited_rag <TICKER> <QUESTION>", file=sys.stderr)
        sys.exit(1)
    ticker = sys.argv[1]
    question = " ".join(sys.argv[2:])
    pack = query_company_knowledge(ticker, question)
    print(json.dumps(pack.to_dict(), indent=2, ensure_ascii=False))
