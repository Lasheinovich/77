export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export async function handleApiResponse(response: Response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new ApiError(
            error.message || 'An unexpected error occurred',
            response.status,
            error.code
        )
    }
    return response.json()
}

export function isApiError(error: any): error is ApiError {
    return error instanceof ApiError
}

export function getErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        return error.message
    }
    if (error instanceof Error) {
        return error.message
    }
    return 'An unexpected error occurred'
}

export function logError(error: unknown, context?: Record<string, any>) {
    console.error('Error occurred:', {
        error,
        context,
        timestamp: new Date().toISOString()
    })
    
    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
        // Send to error tracking service
    }
}