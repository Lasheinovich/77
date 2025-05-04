"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "@/hooks/use-translation"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ChevronRight, ChevronDown, X, PanelLeft, PanelRight } from "lucide-react"
import type { SidebarItem } from "@/types/sidebar"
import { useSidebarStore } from "@/stores/sidebar-store"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DynamicSidebarProps {
  className?: string
  user?: any
  onClose?: () => void
  isAdmin?: boolean
  isEditing?: boolean
  onEditComplete?: () => void
}

export function DynamicSidebar({
  className,
  user,
  onClose,
  isAdmin = false,
  isEditing = false,
  onEditComplete,
}: DynamicSidebarProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [openSections, setOpenSections] = useLocalStorage<string[]>("ark-open-sidebar-sections", [])
  const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>("ark-sidebar-width", 280)
  const [isResizing, setIsResizing] = useState(false)

  const {
    sections,
    setSections,
    visibleSections,
    setVisibleSections,
    pinnedItems,
    setPinnedItems,
    sidebarPosition,
    setSidebarPosition,
  } = useSidebarStore()

  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setOpenSections(
      openSections.includes(sectionId) ? openSections.filter((id) => id !== sectionId) : [...openSections, sectionId],
    )
  }

  // Handle drag end for reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    if (result.type === "section") {
      const reorderedSections = Array.from(visibleSections)
      const [removed] = reorderedSections.splice(result.source.index, 1)
      reorderedSections.splice(result.destination.index, 0, removed)
      setVisibleSections(reorderedSections)
    } else {
      // Handle item reordering within sections
      const sectionId = result.type
      const section = sections.find((s) => s.id === sectionId)

      if (section) {
        const newItems = Array.from(section.items)
        const [removed] = newItems.splice(result.source.index, 1)
        newItems.splice(result.destination.index, 0, removed)

        setSections(sections.map((s) => (s.id === sectionId ? { ...s, items: newItems } : s)))
      }
    }
  }

  // Handle sidebar resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const delta = sidebarPosition === "left" ? e.clientX - startX : startX - e.clientX

      const newWidth = Math.max(200, Math.min(400, startWidth + delta))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Toggle item pinning
  const togglePinItem = (itemId: string) => {
    setPinnedItems(pinnedItems.includes(itemId) ? pinnedItems.filter((id) => id !== itemId) : [...pinnedItems, itemId])
  }

  // Toggle sidebar position (left/right)
  const toggleSidebarPosition = () => {
    setSidebarPosition(sidebarPosition === "left" ? "right" : "left")
  }

  // Render sidebar items
  const renderItems = (items: SidebarItem[], sectionId: string) => {
    return (
      <Droppable droppableId={`items-${sectionId}`} type={sectionId} isDropDisabled={!isEditing}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
            {items.map((item, index) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              const isPinned = pinnedItems.includes(item.id)

              return (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!isEditing}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn("group relative", isEditing && "hover:bg-accent/50 rounded-md")}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          isActive && "bg-accent text-accent-foreground",
                          isPinned && "border-l-2 border-primary pl-2",
                        )}
                        asChild={!isEditing}
                      >
                        {isEditing ? (
                          <div className="flex items-center py-2 px-3">
                            <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                              ⋮⋮
                            </div>
                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                            <span>{t(item.labelKey) || item.label}</span>
                          </div>
                        ) : (
                          <Link href={item.href} onClick={onClose}>
                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                            <span>{t(item.labelKey) || item.label}</span>
                          </Link>
                        )}
                      </Button>

                      {isEditing && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => togglePinItem(item.id)}
                          >
                            <span className="sr-only">{isPinned ? "Unpin item" : "Pin item"}</span>
                            {isPinned ? "📌" : "📍"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    )
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col h-full bg-background transition-all duration-300",
          sidebarPosition === "right" ? "border-l" : "border-r",
          isResizing && "select-none",
          className,
        )}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">
                The Ark <span className="text-primary">الفلك</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleSidebarPosition} className="h-8 w-8">
                    {sidebarPosition === "left" ? (
                      <PanelLeft className="h-4 w-4" />
                    ) : (
                      <PanelRight className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{sidebarPosition === "left" ? "Move to right" : "Move to left"}</TooltipContent>
              </Tooltip>
            )}

            {isMobile && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}

            {isAdmin && !isEditing && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/admin/sidebar-editor")}>
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit sidebar layout</TooltipContent>
              </Tooltip>
            )}

            {isEditing && (
              <Button variant="primary" size="sm" onClick={onEditComplete}>
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            <DragDropContext onDragEnd={handleDragEnd}>
              {/* Pinned Items */}
              {pinnedItems.length > 0 && (
                <div className="mb-4 pb-2 border-b">
                  <h4 className="text-xs uppercase text-muted-foreground font-medium mb-2 px-2">{t("pinned")}</h4>
                  <div className="space-y-1">
                    {sections
                      .flatMap((section) => section.items.filter((item) => pinnedItems.includes(item.id)))
                      .map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

                        return (
                          <Button
                            key={`pinned-${item.id}`}
                            variant="ghost"
                            className={cn("w-full justify-start", isActive && "bg-accent text-accent-foreground")}
                            asChild
                          >
                            <Link href={item.href} onClick={onClose}>
                              {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                              <span>{t(item.labelKey) || item.label}</span>
                            </Link>
                          </Button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Sections */}
              <Droppable droppableId="sections" type="section" isDropDisabled={!isEditing}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                    {visibleSections.map((sectionId, index) => {
                      const section = sections.find((s) => s.id === sectionId)
                      if (!section) return null

                      const isOpen = openSections.includes(section.id)

                      return (
                        <Draggable key={section.id} draggableId={section.id} index={index} isDragDisabled={!isEditing}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(isEditing && "hover:bg-accent/30 rounded-md p-1")}
                            >
                              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                                <div className="flex items-center">
                                  {isEditing && (
                                    <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                      ⋮⋮
                                    </div>
                                  )}
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                                      <div className="flex items-center">
                                        {section.icon && <section.icon className="mr-2 h-4 w-4" />}
                                        <span className="text-sm font-medium">
                                          {t(section.labelKey) || section.label}
                                        </span>
                                      </div>
                                      {isOpen ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>

                                <CollapsibleContent>
                                  <div className="pl-4 pt-1">{renderItems(section.items, section.id)}</div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </ScrollArea>

        {/* Resize Handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors",
            sidebarPosition === "left" ? "right-0" : "left-0",
          )}
          onMouseDown={handleResizeStart}
        />
      </div>
    </TooltipProvider>
  )
}
