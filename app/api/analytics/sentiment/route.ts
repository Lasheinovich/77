import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const filters = await request.json()
        
        // In production, this would call your data-pipeline service
        const response = await fetch('http://data-pipeline:8000/analyze/sentiment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filters)
        })
        
        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in sentiment analytics route:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}