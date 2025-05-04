import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/loading-spinner"
import SemanticGraph from "@/components/visualizations/SemanticGraph"

interface Point {
  x: number
  y: number
  cluster: number
  pattern_info?: {
    cluster_id: number
    size: number
    core_examples: string[]
    coherence_score: number
  }
}

interface VisualizationData {
  type: string
  points: Point[]
}

interface Props {
  data: VisualizationData
}

export default function PatternVisualization({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [activeTab, setActiveTab] = useState('graph')
  
  const analyzeText = async () => {
    if (!text.trim()) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/analyze/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze text')
      }
      
      const result = await response.json()
      setAnalysisResult(result)
    } catch (error) {
      console.error('Error analyzing text:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!svgRef.current || !data?.points?.length) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove()

    const width = 800
    const height = 600
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([d3.min(data.points, d => d.x)!, d3.max(data.points, d => d.x)!])
      .range([margin.left, width - margin.right])

    const yScale = d3.scaleLinear()
      .domain([d3.min(data.points, d => d.y)!, d3.max(data.points, d => d.y)!])
      .range([height - margin.bottom, margin.top])

    // Create color scale for clusters
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "absolute hidden bg-black/80 text-white p-2 rounded text-sm")

    // Add points
    svg.selectAll("circle")
      .data(data.points)
      .join("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 5)
      .attr("fill", d => colorScale(d.cluster.toString()))
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .classed("hidden", false)
          .html(`
            <div>
              <p><strong>Cluster:</strong> ${d.cluster + 1}</p>
              ${d.pattern_info ? `
                <p><strong>Size:</strong> ${d.pattern_info.size}</p>
                <p><strong>Coherence:</strong> ${d.pattern_info.coherence_score.toFixed(2)}</p>
              ` : ''}
            </div>
          `)
      })
      .on("mouseout", () => {
        tooltip.classed("hidden", true)
      })

    // Add convex hulls for clusters
    const clusters = d3.group(data.points, d => d.cluster)
    clusters.forEach((points, cluster) => {
      if (cluster === -1) return // Skip noise points

      const hull = d3.polygonHull(points.map(p => [xScale(p.x), yScale(p.y)]))
      if (!hull) return

      svg.append("path")
        .attr("d", `M${hull.join("L")}Z`)
        .attr("fill", colorScale(cluster.toString()))
        .attr("fill-opacity", 0.1)
        .attr("stroke", colorScale(cluster.toString()))
        .attr("stroke-width", 1)
    })

    // Cleanup
    return () => {
      tooltip.remove()
    }
  }, [data])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Text Analysis</CardTitle>
          <CardDescription>
            Enter text to analyze semantic patterns and relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea 
              placeholder="Enter text to analyze..." 
              className="min-h-[200px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button 
              onClick={analyzeText} 
              disabled={loading || !text.trim()}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Analyze Text'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="graph">Semantic Graph</TabsTrigger>
                <TabsTrigger value="concepts">Top Concepts</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="graph" className="pt-4">
                <SemanticGraph 
                  nodes={analysisResult.graph.nodes}
                  edges={analysisResult.graph.edges}
                  height="500px"
                />
              </TabsContent>
              
              <TabsContent value="concepts" className="pt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {analysisResult.topConcepts.map((concept, index) => (
                    <Card key={index} className={`border-l-4 ${concept.sentiment > 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardContent className="p-4">
                        <div className="font-medium">{concept.concept}</div>
                        <div className="text-sm text-muted-foreground flex justify-between">
                          <span>Frequency: {concept.frequency}</span>
                          <span>Sentiment: {concept.sentiment > 0 ? 'Positive' : 'Negative'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="pt-4">
                <div className="h-[400px] w-full bg-muted rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Trend visualization will be implemented in the next phase
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}