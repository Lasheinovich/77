import { useEffect, useRef } from 'react'
import Graph from 'graphology'
import ForceLayout from 'graphology-layout-force'
import { Sigma } from 'sigma'
import { Card } from '@/components/ui/card'

interface SemanticNode {
  id: string
  label: string
  type: 'concept' | 'entity' | 'keyword'
  size: number
  color?: string
}

interface SemanticEdge {
  source: string
  target: string
  weight: number
  type: string
}

interface SemanticGraphProps {
  nodes: SemanticNode[]
  edges: SemanticEdge[]
  height?: string
  width?: string
}

export default function SemanticGraph({ nodes, edges, height = '600px', width = '100%' }: SemanticGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)

  useEffect(() => {
    if (!containerRef.current || !nodes.length) return

    // Create graph instance
    const graph = new Graph()

    // Add nodes
    nodes.forEach(node => {
      graph.addNode(node.id, {
        label: node.label,
        size: node.size,
        color: node.color || getNodeColor(node.type),
        type: node.type
      })
    })

    // Add edges
    edges.forEach(edge => {
      graph.addEdge(edge.source, edge.target, {
        weight: edge.weight,
        type: edge.type,
        size: edge.weight,
        color: getEdgeColor(edge.type)
      })
    })

    // Initialize layout
    const layout = new ForceLayout(graph, {
      settings: {
        gravity: 1,
        strongGravity: true,
        scalingRatio: 2
      }
    })

    // Run layout
    layout.start()
    layout.stop()

    // Initialize Sigma
    sigmaRef.current = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: true,
      defaultEdgeColor: '#999',
      defaultNodeColor: '#666'
    })

    return () => {
      sigmaRef.current?.kill()
      graph.clear()
    }
  }, [nodes, edges])

  return (
    <Card className="overflow-hidden">
      <div ref={containerRef} style={{ height, width }} />
    </Card>
  )
}

function getNodeColor(type: string): string {
  switch (type) {
    case 'concept':
      return '#4CAF50'
    case 'entity':
      return '#2196F3'
    case 'keyword':
      return '#FFC107'
    default:
      return '#9E9E9E'
  }
}

function getEdgeColor(type: string): string {
  switch (type) {
    case 'related':
      return '#90CAF9'
    case 'similar':
      return '#A5D6A7'
    case 'contains':
      return '#FFE082'
    default:
      return '#E0E0E0'
  }
}