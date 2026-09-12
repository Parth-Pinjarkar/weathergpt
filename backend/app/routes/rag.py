"""
WeatherGPT — RAG & Knowledge Endpoints
──────────────────────────────────────
Provides search and catalog retrieval for meteorological standards,
NDMA emergency guidelines, and safety directives.
"""

from fastapi import APIRouter, Query
from typing import Optional
from app.services.rag_service import search_knowledge_base, get_all_knowledge_documents

router = APIRouter(prefix="/rag", tags=["RAG & Knowledge Base"])


@router.get("/search")
def search_rag(q: str = Query(..., description="Query for weather guidelines or disaster preparedness")):
    """Performs semantic similarity retrieval over indexed weather knowledge documents."""
    results = search_knowledge_base(q, top_k=4)
    return {
        "query": q,
        "results_count": len(results),
        "documents": results
    }


@router.get("/documents")
def list_rag_documents():
    """Returns all indexed knowledge documents."""
    docs = get_all_knowledge_documents()
    return {
        "total_documents": len(docs),
        "documents": docs
    }
