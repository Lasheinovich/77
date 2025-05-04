/**
 * Search API Client
 * Provides functions for interacting with the deep-search service
 */

/**
 * Search result interface
 */
export interface SearchResult {
  id?: string
  title: string
  content: string
  url?: string
  source: string
  score: number
  metadata?: Record<string, any>
  timestamp?: string
  highlights?: string[]
}

/**
 * Search response interface
 */
export interface SearchResponse {
  query: string
  results: SearchResult[]
  total: number
  sources: string[]
  execution_time: number
  facets?: Record<string, Record<string, number>>
}

/**
 * Search parameters interface
 */
export interface SearchParams {
  q: string
  limit?: number
  offset?: number
  sources?: string[]
  filters?: Record<string, any>
}

/**
 * Vector search parameters interface
 */
export interface VectorSearchParams {
  query: string
  limit?: number
  collection?: string
}

/**
 * Search API client
 */
class SearchAPIClient {
  /**
   * Base URL for the search API
   */
  private baseUrl: string

  /**
   * Constructor
   */
  constructor() {
    // Use the base path or the environment variable
    this.baseUrl = '/api/search'
  }

  /**
   * Perform a search
   * @param params Search parameters
   * @returns Search results
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set('q', params.q)
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.offset) searchParams.set('offset', params.offset.toString())
    if (params.sources && params.sources.length > 0) {
      params.sources.forEach(source => searchParams.append('source', source))
    }
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(`filter[${key}]`, v.toString()))
        } else {
          searchParams.set(`filter[${key}]`, value.toString())
        }
      })
    }

    try {
      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Search failed with status: ${response.status}`)
      }

      const data = await response.json()
      return this.transformResponse(data)
    } catch (error) {
      console.error('Search API client error:', error)
      throw error
    }
  }

  /**
   * Perform a vector search
   * @param params Vector search parameters
   * @returns Search results
   */
  async vectorSearch(params: VectorSearchParams): Promise<SearchResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Vector search failed with status: ${response.status}`)
      }

      const data = await response.json()
      return this.transformResponse(data)
    } catch (error) {
      console.error('Vector search API client error:', error)
      throw error
    }
  }

  /**
   * Get search sources
   * @returns List of available search sources
   */
  async getSources(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sources`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to get sources with status: ${response.status}`)
      }

      const data = await response.json()
      return data.sources || []
    } catch (error) {
      console.error('Get sources API client error:', error)
      throw error
    }
  }

  /**
   * Transform API response to match our interfaces
   * @param data API response data
   * @returns Transformed search response
   */
  private transformResponse(data: any): SearchResponse {
    return {
      query: data.query || '',
      results: Array.isArray(data.results)
        ? data.results.map(this.transformResult)
        : [],
      total: data.total || 0,
      sources: data.sources || [],
      execution_time: data.execution_time || 0,
      facets: data.facets || {},
    }
  }

  /**
   * Transform result item
   * @param result API result item
   * @returns Transformed search result
   */
  private transformResult(result: any): SearchResult {
    return {
      id: result.id,
      title: result.title || 'Untitled',
      content: result.content || '',
      url: result.url,
      source: result.source || 'unknown',
      score: result.score || 0,
      metadata: result.metadata || {},
      timestamp: result.timestamp,
      highlights: Array.isArray(result.highlights) ? result.highlights : [],
    }
  }
}

/**
 * Export a singleton instance
 */
export const searchAPI = new SearchAPIClient()