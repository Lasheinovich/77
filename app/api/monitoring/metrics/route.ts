import { NextResponse } from 'next/server'
import { handleApiResponse, logError } from '@/lib/error-utils'

export async function GET() {
    try {
        const response = await fetch('http://monitoring:8000/health/metrics')
        const data = await handleApiResponse(response)
        return NextResponse.json(data)
    } catch (error) {
        logError(error, { route: '/api/monitoring/metrics' })
        return NextResponse.json(
            { error: 'Failed to fetch system metrics data' },
            { status: 500 }
        )
    }
}