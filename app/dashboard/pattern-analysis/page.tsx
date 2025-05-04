import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from 'next/dynamic'
import { LoadingSpinner } from "@/components/loading-spinner"
import { api } from "@/lib/api-client" // Import the API client

// Dynamic import for the visualization component
const PatternVisualization = dynamic(
  () => import('@/components/patterns/visualization'),
  { ssr: false }
)

export default function PatternAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [patterns, setPatterns] = useState([])
  const [visualizationData, setVisualizationData] = useState(null)
  const [activeView, setActiveView] = useState('visualization')

  useEffect(() => {
    fetchPatternData()
  }, [])

  const fetchPatternData = async () => {
    try {
      setLoading(true)
      // Use the API client instead of direct fetch
      const data = await api.get('/api/analyze/patterns')
      setPatterns(data.patterns)
      setVisualizationData(data.visualization_data)
    } catch (error) {
      console.error('Error fetching pattern data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Pattern Analysis Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList>
              <TabsTrigger value="visualization">Visual Analysis</TabsTrigger>
              <TabsTrigger value="patterns">Pattern Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visualization">
              {visualizationData && (
                <PatternVisualization data={visualizationData} />
              )}
            </TabsContent>
            
            <TabsContent value="patterns">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {patterns.map((pattern) => (
                  <Card key={pattern.cluster_id}>
                    <CardHeader>
                      <CardTitle>Pattern {pattern.cluster_id + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Size:</strong> {pattern.size} items</p>
                        <p><strong>Coherence:</strong> {pattern.coherence_score.toFixed(2)}</p>
                        <div>
                          <strong>Core Examples:</strong>
                          <ul className="list-disc pl-4 mt-1">
                            {pattern.core_examples.map((example, i) => (
                              <li key={i} className="text-sm">{example}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
};

export default PatternAnalysisPage;
