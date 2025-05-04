"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Responsive, WidthProvider } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
  component: React.ReactNode
}

interface LayoutEngineProps {
  layouts: {
    lg?: LayoutItem[]
    md?: LayoutItem[]
    sm?: LayoutItem[]
    xs?: LayoutItem[]
  }
  className?: string
  editable?: boolean
  onLayoutChange?: (layout: any, layouts: any) => void
  storageKey?: string
  cols?: { lg: number; md: number; sm: number; xs: number }
  rowHeight?: number
  containerPadding?: [number, number]
  margin?: [number, number]
}

export function LayoutEngine({
  layouts: initialLayouts,
  className,
  editable = false,
  onLayoutChange,
  storageKey,
  cols = { lg: 12, md: 10, sm: 6, xs: 4 },
  rowHeight = 30,
  containerPadding = [10, 10],
  margin = [10, 10],
}: LayoutEngineProps) {
  const [layouts, setLayouts] = useState(initialLayouts)
  const [savedLayouts, setSavedLayouts] = useLocalStorage<any>(storageKey || "ark-layouts", null)

  // Load saved layouts if available
  useEffect(() => {
    if (storageKey && savedLayouts) {
      setLayouts(savedLayouts)
    }
  }, [savedLayouts, storageKey])

  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts)
    if (onLayoutChange) {
      onLayoutChange(currentLayout, allLayouts)
    }
    if (storageKey) {
      setSavedLayouts(allLayouts)
    }
  }

  // Convert layout items to grid items
  const getLayoutComponents = (items: LayoutItem[] = []) => {
    return items.map((item) => ({
      ...item,
      component: undefined,
    }))
  }

  // Render components based on layout
  const renderComponents = (breakpoint: string) => {
    const layoutItems = layouts[breakpoint as keyof typeof layouts] || []
    return layoutItems.map((item: LayoutItem) => (
      <div key={item.i} className="bg-card rounded-lg shadow overflow-hidden">
        {item.component}
      </div>
    ))
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: getLayoutComponents(layouts.lg),
          md: getLayoutComponents(layouts.md),
          sm: getLayoutComponents(layouts.sm),
          xs: getLayoutComponents(layouts.xs),
        }}
        cols={cols}
        rowHeight={rowHeight}
        containerPadding={containerPadding}
        margin={margin}
        isDraggable={editable}
        isResizable={editable}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      >
        {renderComponents("lg")}
      </ResponsiveGridLayout>
    </div>
  )
}
