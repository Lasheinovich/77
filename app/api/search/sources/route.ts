/**
 * Search sources API route handler
 * Proxies requests to the deep-search backend service to retrieve available search sources
 */
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const SEARCH_API_URL = process.env.DEEP_SEARCH_API_URL || 'http://deep-search:8004';

export async function GET() {
  try {
    // Build target URL for deep-search backend API
    const targetUrl = new URL('/api/sources', SEARCH_API_URL);

    // Forward request to backend API
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': headers().get('user-agent') || 'next-app',
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      console.error('Sources API error:', response.status, await response.text());
      return NextResponse.json(
        { error: `Failed to fetch sources with status: ${response.status}` },
        { status: response.status }
      );
    }

    // Return sources
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sources API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}