/**
 * PostgreSQL Vector Database Utilities
 * Provides search functionality for VND and NPA databases
 */

import { Pool, PoolConfig } from 'pg'

// Database connection configurations from environment variables
const VND_CONFIG: PoolConfig = {
  host: process.env.VND_DB_HOST || 'localhost',
  port: parseInt(process.env.VND_DB_PORT || '5432'),
  database: process.env.VND_DB_NAME || 'vnd',
  user: process.env.VND_DB_USER || 'postgres',
  password: process.env.VND_DB_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}

const NPA_CONFIG: PoolConfig = {
  host: process.env.NPA_DB_HOST || 'localhost',
  port: parseInt(process.env.NPA_DB_PORT || '5432'),
  database: process.env.NPA_DB_NAME || 'npa',
  user: process.env.NPA_DB_USER || 'postgres',
  password: process.env.NPA_DB_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}

// Connection pools
let vndPool: Pool | null = null
let npaPool: Pool | null = null

/**
 * Get VND database connection pool
 */
export function getVNDPool(): Pool {
  if (!vndPool) {
    vndPool = new Pool(VND_CONFIG)
  }
  return vndPool
}

/**
 * Get NPA database connection pool
 */
export function getNPAPool(): Pool {
  if (!npaPool) {
    npaPool = new Pool(NPA_CONFIG)
  }
  return npaPool
}

/**
 * Search result interface
 */
export interface SearchResult {
  title: string
  text: string
  similarity: number
  metadata: Record<string, unknown>
}

/**
 * Search VND database by text similarity
 * Note: Embedding generation happens on Python backend
 */
export async function searchVND(
  queryVector: number[],
  options: {
    topK?: number
    minScore?: number
    limit?: number
  } = {}
): Promise<SearchResult[]> {
  const { topK = 8, minScore = 0.3, limit = 12 } = options

  const pool = getVNDPool()

  const query = `
    WITH search_params AS (
      SELECT
        $1::vector(1024) AS query_vec,
        $2::int AS k_limit,
        $3::float AS min_threshold
    ),
    section_results AS (
      SELECT
        'section' AS level,
        s.document_id,
        s.id AS section_id,
        NULL::uuid AS subsection_id,
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
    SELECT
      level,
      document_id,
      section_id,
      subsection_id,
      title,
      text,
      similarity,
      filename,
      doc_title
    FROM combined_results
    WHERE similarity >= (SELECT min_threshold FROM search_params)
    ORDER BY
      similarity DESC,
      CASE WHEN level = 'section' THEN 1 ELSE 2 END,
      char_count DESC
    LIMIT $4;
  `

  try {
    const result = await pool.query(query, [
      JSON.stringify(queryVector),
      topK,
      minScore,
      limit,
    ])

    return result.rows.map((row) => ({
      title: row.title || 'Без названия',
      text: row.text || '',
      similarity: parseFloat(row.similarity),
      metadata: {
        level: row.level,
        documentId: row.document_id,
        sectionId: row.section_id,
        subsectionId: row.subsection_id,
        filename: row.filename,
        docTitle: row.doc_title,
      },
    }))
  } catch (error) {
    console.error('VND search error:', error)
    throw new Error('Failed to search VND database')
  }
}

/**
 * Search NPA database with hybrid search (BM25 + Dense vectors)
 * Note: Embedding generation happens on Python backend
 */
export async function searchNPA(
  queryText: string,
  queryVector: number[],
  options: {
    topK?: number
    minScore?: number
  } = {}
): Promise<SearchResult[]> {
  const { topK = 10, minScore = 0.3 } = options

  const pool = getNPAPool()

  // Hybrid search: BM25 + Dense vector search with RRF
  const query = `
    WITH bm25_results AS (
      SELECT
        c.id,
        c.doc_id,
        c.metadata,
        c.chunk,
        ts_rank_cd(c.chunk_tsv, plainto_tsquery('russian', $1)) AS bm25_score,
        ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.chunk_tsv, plainto_tsquery('russian', $1)) DESC) AS bm25_rank
      FROM content_chunks c
      WHERE c.chunk_tsv @@ plainto_tsquery('russian', $1)
      ORDER BY bm25_score DESC
      LIMIT $2
    ),
    vector_results AS (
      SELECT
        c.id,
        c.doc_id,
        c.metadata,
        c.chunk,
        1 - (c.embedding <=> $3::vector(1024)) AS vector_score,
        ROW_NUMBER() OVER (ORDER BY c.embedding <=> $3::vector(1024)) AS vector_rank
      FROM content_chunks c
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $3::vector(1024)
      LIMIT $2
    ),
    combined AS (
      SELECT DISTINCT ON (c.id)
        c.id,
        c.doc_id,
        c.metadata,
        c.chunk,
        COALESCE(b.bm25_score, 0) AS bm25_score,
        COALESCE(v.vector_score, 0) AS vector_score,
        COALESCE(b.bm25_rank, 999999) AS bm25_rank,
        COALESCE(v.vector_rank, 999999) AS vector_rank,
        (1.0 / (60 + COALESCE(b.bm25_rank, 999999)) + 1.0 / (60 + COALESCE(v.vector_rank, 999999))) AS rrf_score
      FROM content_chunks c
      LEFT JOIN bm25_results b ON c.id = b.id
      LEFT JOIN vector_results v ON c.id = v.id
      WHERE b.id IS NOT NULL OR v.id IS NOT NULL
    )
    SELECT
      c.id,
      c.doc_id,
      c.metadata,
      c.chunk,
      c.bm25_score,
      c.vector_score,
      c.rrf_score,
      m.title,
      m.doc_type,
      m.doc_number,
      m.source_url
    FROM combined c
    LEFT JOIN document_metadata m ON c.doc_id = m.id
    WHERE c.rrf_score > $4
    ORDER BY c.rrf_score DESC
    LIMIT $2;
  `

  try {
    const result = await pool.query(query, [
      queryText,
      topK,
      JSON.stringify(queryVector),
      minScore,
    ])

    return result.rows.map((row) => ({
      title: row.title || row.metadata || 'Без названия',
      text: row.chunk || '',
      similarity: parseFloat(row.rrf_score),
      metadata: {
        docId: row.doc_id,
        docType: row.doc_type,
        docNumber: row.doc_number,
        sourceUrl: row.source_url,
        bm25Score: parseFloat(row.bm25_score),
        vectorScore: parseFloat(row.vector_score),
      },
    }))
  } catch (error) {
    console.error('NPA search error:', error)
    throw new Error('Failed to search NPA database')
  }
}

/**
 * Close database connections
 */
export async function closeConnections(): Promise<void> {
  if (vndPool) {
    await vndPool.end()
    vndPool = null
  }
  if (npaPool) {
    await npaPool.end()
    npaPool = null
  }
}
