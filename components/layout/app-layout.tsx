"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { AccessibilityToolbar } from "@/components/accessibility/accessibility-toolbar"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { setupGlobalErrorHandlers } from "@/lib/error-tracking"
import { logger } from "@/lib/logger"

interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showFooter?: boolean
  fullWidth?: boolean
  className?: string
}

export function AppLayout({
  children,
  showSidebar = true,
  showFooter = true,
  fullWidth = false,
  className,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { user } = useAuth()
  const { dir } = useLanguage()

  // Set up global error handlers
  useEffect(() => {
    setupGlobalErrorHandlers()
    logger.info("App layout mounted", { pathname })

    return () => {
      logger.info("App layout unmounted", { pathname })
    }
  }, [pathname])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  // Determine if sidebar should be shown based on route
  const shouldShowSidebar =
    showSidebar &&
    (pathname?.startsWith("/dashboard") ||
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/learn") ||
      pathname?.startsWith("/ai-assistant") ||
      pathname?.startsWith("/coding-playground") ||
      pathname?.startsWith("/marketplace") ||
      pathname?.startsWith("/community"))

  return (
    <div className={cn("flex min-h-screen flex-col", className)} dir={dir}>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className={cn("container flex h-16 items-center", fullWidth && "max-w-none")}>
          {shouldShowSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          <ErrorBoundary componentName="MainNav">
            <MainNav />
          </ErrorBoundary>
        </div>
      </header>

      <div className="flex flex-1">
        {shouldShowSidebar && (
          <ErrorBoundary componentName="Sidebar">
            <Sidebar
              className={cn(
                "fixed inset-y-0 left-0 z-30 w-64 transform border-r bg-background pt-16 transition-transform duration-200 md:static md:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
                dir === "rtl" && "left-auto right-0",
              )}
              user={user}
              onClose={() => setSidebarOpen(false)}
            />
          </ErrorBoundary>
        )}

        <main
          className={cn(
            "flex-1",
            shouldShowSidebar && "md:ml-64",
            dir === "rtl" && shouldShowSidebar && "md:ml-0 md:mr-64",
          )}
        >
          <ErrorBoundary>
            <div className={cn("container py-6", fullWidth && "max-w-none px-2")}>{children}</div>
          </ErrorBoundary>
        </main>
      </div>

      {showFooter && (
        <ErrorBoundary componentName="Footer">
          <Footer />
        </ErrorBoundary>
      )}

      <AccessibilityToolbar position="bottom-right" />
    </div>
  )
}
