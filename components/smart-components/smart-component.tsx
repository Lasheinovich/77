"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"

interface SmartComponentProps {
  id: string
  title?: string
  description?: string
  type: "card" | "list" | "table" | "chart" | "form" | "custom"
  className?: string
  children: React.ReactNode
  alternatives?: React.ReactNode[]
  onAlternativeSelected?: (index: number) => void
  usage?: "dashboard" | "admin" | "user" | "marketing" | "analytics"
  adaptiveHeight?: boolean
  loading?: boolean
}

export function SmartComponent({
  id,
  title,
  description,
  type,
  className,
  children,
  alternatives = [],
  onAlternativeSelected,
  usage = "dashboard",
  adaptiveHeight = false,
  loading = false,
}: SmartComponentProps) {
  const [selectedAlternative, setSelectedAlternative] = useLocalStorage<number>(`smart-component-${id}`, 0)
  const [usageData, setUsageData] = useLocalStorage<Record<string, number>>(`smart-component-usage-${id}`, {})
  const [height, setHeight] = useState<number | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)

  // Track component usage
  useEffect(() => {
    setUsageData((prev) => ({
      ...prev,
      [usage]: (prev?.[usage] || 0) + 1,
    }))
  }, [usage, setUsageData])

  // Measure content height for adaptive sizing
  useEffect(() => {
    if (adaptiveHeight) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeight(entry.contentRect.height)
        }
      })

      const element = document.getElementById(`smart-component-content-${id}`)
      if (element) {
        observer.observe(element)
      }

      return () => {
        if (element) {
          observer.unobserve(element)
        }
      }
    }
  }, [id, adaptiveHeight, children, selectedAlternative])

  const handleAlternativeSelect = (index: number) => {
    setSelectedAlternative(index)
    if (onAlternativeSelected) {
      onAlternativeSelected(index)
    }
    setShowAlternatives(false)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )
    }

    if (alternatives.length > 0 && selectedAlternative > 0) {
      return alternatives[selectedAlternative - 1]
    }

    return children
  }

  return (
    <Card
      className={cn("transition-all duration-300", adaptiveHeight && height ? `h-[${height}px]` : "", className)}
      data-component-type={type}
      data-component-id={id}
    >
      {title && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {alternatives.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="p-1 rounded-md hover:bg-muted"
                aria-label="Show alternative views"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
              {showAlternatives && (
                <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <button
                      className={cn(
                        "block px-4 py-2 text-sm w-full text-left",
                        selectedAlternative === 0
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                      onClick={() => handleAlternativeSelect(0)}
                    >
                      Default View
                    </button>
                    {alternatives.map((_, index) => (
                      <button
                        key={index}
                        className={cn(
                          "block px-4 py-2 text-sm w-full text-left",
                          selectedAlternative === index + 1
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted",
                        )}
                        onClick={() => handleAlternativeSelect(index + 1)}
                      >
                        Alternative {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent id={`smart-component-content-${id}`}>{renderContent()}</CardContent>
    </Card>
  )
}
