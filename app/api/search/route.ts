import { NextRequest, NextResponse } from 'next/server'

/**
 * API route for search functionality
 * Acts as a proxy to the deep-search backend service
 */

// Deep search service URL from environment variable with fallback
const DEEP_SEARCH_URL = process.env.DEEP_SEARCH_URL || 'http://localhost:8004'

/**
 * GET handler for search requests
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // Validate query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Construct the search URL with all parameters
    const searchUrl = new URL(`${DEEP_SEARCH_URL}/api/search`)

    // Copy all query parameters
    searchParams.forEach((value, key) => {
      searchUrl.searchParams.append(key, value)
    })

    // Make the request to the deep search backend
    const response = await fetch(searchUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.DEEP_SEARCH_API_KEY || '',
      },
      // Pass along any credentials, like cookies
      credentials: 'include',
      // Use the same cache directive
      cache: request.headers.get('Cache-Control') || 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Search error: ${response.status} ${response.statusText}`, errorText)

      return NextResponse.json(
        { error: `Search failed with status: ${response.status}` },
        { status: response.status }
      )
    }

    // Parse and return the JSON response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for vector-based search
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate request
    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required for vector search' },
        { status: 400 }
      )
    }

    // Make the request to the vector search endpoint
    const response = await fetch(`${DEEP_SEARCH_URL}/api/search/vector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.DEEP_SEARCH_API_KEY || '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Vector search error: ${response.status} ${response.statusText}`, errorText)

      return NextResponse.json(
        { error: `Vector search failed with status: ${response.status}` },
        { status: response.status }
      )
    }

    // Parse and return the JSON response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Vector search API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}