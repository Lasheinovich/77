import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // In production, this would be fetched from your semantic-extractor service
        // For now, return mock data that matches the expected format
        return NextResponse.json({
            graph: {
                nodes: [
                    { id: "concept_1", label: "Machine Learning", type: "concept", size: 2 },
                    { id: "entity_1", label: "Natural Language Processing", type: "entity", size: 3 },
                    { id: "keyword_1", label: "Data Analysis", type: "keyword", size: 2 }
                ],
                edges: [
                    { source: "concept_1", target: "entity_1", weight: 0.8, type: "similar" },
                    { source: "entity_1", target: "keyword_1", weight: 0.6, type: "related" }
                ]
            },
            trends: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                concepts: Math.floor(Math.random() * 50) + 50,
                entities: Math.floor(Math.random() * 40) + 40,
                patterns: Math.floor(Math.random() * 30) + 30
            })),
            topConcepts: [
                { concept: "Machine Learning", frequency: 15, sentiment: 1 },
                { concept: "Data Analysis", frequency: 12, sentiment: 1 },
                { concept: "Neural Networks", frequency: 10, sentiment: 1 },
                { concept: "Deep Learning", frequency: 8, sentiment: 1 },
                { concept: "Natural Language Processing", frequency: 7, sentiment: 1 }
            ]
        })
    } catch (error) {
        console.error('Error in semantic analytics route:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        // In production, this would call your semantic-extractor service
        const response = await fetch('http://semantic-extractor:8000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
        
        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in semantic analytics route:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}