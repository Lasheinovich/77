"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import SemanticGraph from '@/components/visualizations/SemanticGraph'
import AdvancedAnalytics from '@/components/visualizations/AdvancedAnalytics'
import SystemHealthPanel from '@/components/monitoring/SystemHealthPanel'
import { useAnalytics } from '@/hooks/useAnalytics'
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { getErrorMessage } from '@/lib/error-utils'

function AnalyticsDashboardContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('analytics')
  
  const {
    data,
    loading,
    error,
    refresh,
    updateFilters
  } = useAnalytics()

  if (loading) return <LoadingSpinner />
  if (error) return (
    <Alert variant="destructive">
      <AlertDescription>
        {getErrorMessage(error)}
      </AlertDescription>
    </Alert>
  )
  if (!data) return <div>No data available</div>

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics & System Health</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search analytics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button onClick={refresh}>Refresh</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="relationships">Semantic Relationships</TabsTrigger>
          <TabsTrigger value="monitoring">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <ErrorBoundary>
            <AdvancedAnalytics 
              data={data}
              onRefresh={refresh}
              onFilter={updateFilters}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="relationships">
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle>Semantic Network</CardTitle>
              </CardHeader>
              <CardContent>
                <SemanticGraph
                  nodes={data.graphData.nodes}
                  edges={data.graphData.edges}
                  height="600px"
                />
              </CardContent>
            </Card>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="monitoring">
          <ErrorBoundary>
            <SystemHealthPanel />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AnalyticsDashboard() {
  return (
    <ErrorBoundary>
      <AnalyticsDashboardContent />
    </ErrorBoundary>
  )
}