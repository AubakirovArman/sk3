/**
 * Embedding Service Client
 * Client for generating text embeddings via BGE-M3 API
 */

export interface EmbeddingRequest {
  texts: string[]
  return_dense: boolean
  return_sparse?: boolean
  return_colbert_vecs?: boolean
}

export interface EmbeddingResponse {
  dense_vecs?: number[][] // Dense embeddings (1024-dim)
  lexical_weights?: Record<string, number>[]
  colbert_vecs?: number[][][]
}

export class EmbeddingClient {
  private baseURL: string

  constructor(baseURL: string = 'https://bge-m3.sk-ai.kz') {
    this.baseURL = baseURL
  }

  /**
   * Generate embeddings for texts
   */
  async embed(texts: string[], normalize: boolean = true): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseURL}/encode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          return_dense: true,
          return_sparse: false,
          return_colbert_vecs: false,
        } as EmbeddingRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Embedding service error (${response.status}): ${errorText}`)
      }

      const data: EmbeddingResponse = await response.json()
      
      if (!data.dense_vecs) {
        throw new Error('No dense embeddings returned from API')
      }
      
      return data.dense_vecs
    } catch (error) {
      console.error('Embedding generation failed:', error)
      throw error
    }
  }

  /**
   * Generate embedding for single text
   */
  async embedSingle(text: string, normalize: boolean = true): Promise<number[]> {
    const embeddings = await this.embed([text], normalize)
    return embeddings[0]
  }

  /**
   * Check if embedding service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple request
      const response = await fetch(`${this.baseURL}/encode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: ['health check'],
          return_dense: true,
        }),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const embeddingClient = new EmbeddingClient(
  process.env.EMBEDDING_SERVICE_URL || 'https://bge-m3.sk-ai.kz'
)
