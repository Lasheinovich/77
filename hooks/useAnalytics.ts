import { useState, useEffect, useCallback } from 'react'

interface AnalyticsData {
  graphData: {
    nodes: any[]
    edges: any[]
  }
  trendData: any[]
  sentimentData: any[]
  conceptData: any[]
}

interface AnalyticsFilters {
  dateRange?: [Date, Date]
  topics?: string[]
  threshold?: number
}

export function useAnalytics(initialFilters?: AnalyticsFilters) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState(initialFilters || {})

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch semantic graph data
      const graphResponse = await fetch('/api/analytics/semantic')
      const graphData = await graphResponse.json()
      
      // Fetch trend data
      const trendResponse = await fetch('/api/analytics/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
      const trendData = await trendResponse.json()
      
      // Fetch sentiment analysis
      const sentimentResponse = await fetch('/api/analytics/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
      const sentimentData = await sentimentResponse.json()
      
      // Combine all data
      setData({
        graphData: graphData.graph,
        trendData: trendData.trends,
        sentimentData: sentimentData.distribution,
        conceptData: graphData.topConcepts.map((concept: any) => ({
          name: concept.concept,
          value: concept.frequency
        }))
      })
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'))
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  const refresh = useCallback(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refresh
  }
}