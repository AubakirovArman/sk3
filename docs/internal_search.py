import os
import re
import textwrap
from typing import Optional, List, Tuple, Dict, Any

import psycopg2
from pgvector.psycopg2 import register_vector
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


class InternalSearchConfig(BaseModel):
    TOP_K: int = Field(8, description="Candidates per level")
    LIMIT: int = Field(12, description="Final results limit")
    MIN_SCORE: float = Field(0.3, description="Min cosine similarity [0..1]")
    CHAR_BUDGET: int = Field(4000, description="Max context characters")
    EMBED_MODEL: str = Field(default=os.getenv("EMBED_MODEL", "BAAI/bge-m3"))
    DB_DSN: str = Field(default=os.getenv("PG_DSN", "postgresql://postgres:postgres@localhost:5432/vnd"))


_EMBEDDER: Optional[SentenceTransformer] = None


def _get_embedder(model_name: str) -> SentenceTransformer:
    global _EMBEDDER
    if _EMBEDDER is None:
        _EMBEDDER = SentenceTransformer(model_name)
        if "bge-m3" in model_name.lower():
            _EMBEDDER.max_seq_length = 8192
    return _EMBEDDER


def _normalize_query(query: str) -> str:
    query = query.lower().strip()
    query = re.sub(r'[«»"„"]', '"', query)
    query = re.sub(r"\s+", " ", query)
    replacements = {
        "ао": "акционерное общество",
        "сд": "совет директоров",
        "кнв": "комитет по назначениям и вознаграждениям",
        "кс": "корпоративный секретарь",
    }
    for abbr, full in replacements.items():
        query = re.sub(rf"\b{abbr}\b", full, query)
    return query


def _execute_search(conn, query_vector: List[float], cfg: InternalSearchConfig) -> List[Tuple]:
    sql = """
        WITH search_params AS (
            SELECT
                %s::vector(1024) AS query_vec,
                %s::int AS k_limit,
                %s::float AS min_threshold
        ),
        section_results AS (
            SELECT
                'section' AS level,
                s.document_id,
                s.id AS section_id,
                NULL::uuid AS subsection_id,
                NULL::uuid AS chunk_id,
                COALESCE(s.title, s.section_label, 'Без названия') AS title,
                s.text,
                s.token_count,
                s.char_count,
                1 - (s.embedding <=> (SELECT query_vec FROM search_params)) AS similarity,
                d.filename,
                d.title AS doc_title
            FROM sections s
            JOIN documents d ON s.document_id = d.id
            WHERE s.embedding IS NOT NULL
            ORDER BY s.embedding <=> (SELECT query_vec FROM search_params)
            LIMIT (SELECT k_limit FROM search_params)
        ),
        subsection_results AS (
            SELECT
                'subsection' AS level,
                ss.document_id,
                ss.section_id,
                ss.id AS subsection_id,
                NULL::uuid AS chunk_id,
                COALESCE(ss.title, 'Подраздел') AS title,
                ss.text,
                ss.token_count,
                ss.char_count,
                1 - (ss.embedding <=> (SELECT query_vec FROM search_params)) AS similarity,
                d.filename,
                d.title AS doc_title
            FROM subsections ss
            JOIN documents d ON ss.document_id = d.id
            WHERE ss.embedding IS NOT NULL
            ORDER BY ss.embedding <=> (SELECT query_vec FROM search_params)
            LIMIT (SELECT k_limit FROM search_params)
        ),
        combined_results AS (
            SELECT * FROM section_results
            UNION ALL
            SELECT * FROM subsection_results
        )
        SELECT *
        FROM combined_results
        WHERE similarity >= (SELECT min_threshold FROM search_params)
        ORDER BY
            similarity DESC,
            CASE WHEN level = 'section' THEN 1 ELSE 2 END,
            char_count DESC
        LIMIT %s;
    """
    with conn.cursor() as cur:
        cur.execute(sql, (query_vector, cfg.TOP_K, cfg.MIN_SCORE, cfg.LIMIT))
        return cur.fetchall()


def internal_doc_search(query: str, top_k: Optional[int] = None, limit: Optional[int] = None) -> Dict[str, Any]:
    cfg = InternalSearchConfig()
    if top_k is not None:
        cfg.TOP_K = int(top_k)
    if limit is not None:
        cfg.LIMIT = int(limit)

    normalized = _normalize_query(query)
    embedder = _get_embedder(cfg.EMBED_MODEL)
    query_vector = embedder.encode([normalized], normalize_embeddings=True, convert_to_numpy=False)[0].tolist()

    conn = psycopg2.connect(cfg.DB_DSN)
    try:
        register_vector(conn)
        rows = _execute_search(conn, query_vector, cfg)
    finally:
        conn.close()

    results: List[Dict[str, Any]] = []
    for row in rows:
        (
            level,
            document_id,
            section_id,
            subsection_id,
            chunk_id,
            title,
            text,
            token_count,
            char_count,
            similarity,
            filename,
            doc_title,
        ) = row
        results.append({
            "level": level,
            "document_id": str(document_id),
            "section_id": str(section_id) if section_id else None,
            "subsection_id": str(subsection_id) if subsection_id else None,
            "title": title or "",
            "text": (text or "").strip(),
            "similarity": float(similarity),
            "filename": filename,
            "doc_title": doc_title,
        })

    return {
        "query": query,
        "normalized_query": normalized,
        "results": results,
    }



