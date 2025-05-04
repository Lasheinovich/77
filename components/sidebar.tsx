"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "@/hooks/use-translation"
import {
  Home,
  BookOpen,
  ShoppingBag,
  Users,
  MessageSquare,
  Code,
  BarChart,
  Settings,
  FileText,
  Layers,
  Brain,
  Palette,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  className?: string
  user?: any
  onClose?: () => void
}

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  submenu?: SidebarItem[]
  adminOnly?: boolean
}

export function Sidebar({ className, user, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  const isAdmin = user?.role === "admin"

  const sidebarItems: SidebarItem[] = [
    {
      title: t("dashboard"),
      href: "/dashboard",
      icon: Home,
    },
    {
      title: t("learn"),
      href: "/learn",
      icon: BookOpen,
      submenu: [
        {
          title: t("courses"),
          href: "/learn/courses",
          icon: BookOpen,
        },
        {
          title: t("course_generator"),
          href: "/learn/course-generator",
          icon: Brain,
        },
        {
          title: t("certificates"),
          href: "/learn/certificates",
          icon: FileText,
        },
      ],
    },
    {
      title: t("marketplace"),
      href: "/marketplace",
      icon: ShoppingBag,
    },
    {
      title: t("community"),
      href: "/community",
      icon: Users,
    },
    {
      title: t("ai_assistant"),
      href: "/ai-assistant",
      icon: MessageSquare,
    },
    {
      title: t("coding_playground"),
      href: "/coding-playground",
      icon: Code,
    },
    {
      title: t("tools"),
      href: "/tools",
      icon: Layers,
      submenu: [
        {
          title: t("document_generator"),
          href: "/document-generator",
          icon: FileText,
        },
        {
          title: t("form_generator"),
          href: "/tools/form-generator",
          icon: Layers,
        },
        {
          title: t("crud_generator"),
          href: "/tools/crud-generator",
          icon: Layers,
        },
        {
          title: t("ai_form_generator"),
          href: "/tools/ai-form-generator",
          icon: Brain,
        },
      ],
    },
    {
      title: t("var_engine"),
      href: "/var",
      icon: Palette,
      submenu: [
        {
          title: t("3d_models"),
          href: "/var/models",
          icon: Palette,
        },
        {
          title: t("model_generator"),
          href: "/var/model-generator",
          icon: Brain,
        },
      ],
    },
    {
      title: t("admin"),
      href: "/admin",
      icon: Settings,
      adminOnly: true,
      submenu: [
        {
          title: t("dashboard"),
          href: "/admin/dashboard",
          icon: BarChart,
        },
        {
          title: t("users"),
          href: "/admin/users",
          icon: Users,
        },
        {
          title: t("plugins"),
          href: "/admin/plugins",
          icon: Layers,
        },
        {
          title: t("page_builder"),
          href: "/admin/page-builder",
          icon: Palette,
        },
        {
          title: t("system_health"),
          href: "/admin/system-health",
          icon: Settings,
        },
      ],
    },
  ]

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  const renderSidebarItems = (items: SidebarItem[]) => {
    return items
      .filter((item) => !item.adminOnly || isAdmin)
      .map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        const hasSubmenu = item.submenu && item.submenu.length > 0
        const isSubmenuOpen = openSubmenu === item.title

        return (
          <div key={item.href} className="mb-1">
            {hasSubmenu ? (
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={cn("w-full justify-between", isActive && "bg-accent text-accent-foreground")}
                  onClick={() => toggleSubmenu(item.title)}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                  {isSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                {isSubmenuOpen && <div className="ml-4 border-l pl-2 pt-1">{renderSidebarItems(item.submenu)}</div>}
              </div>
            ) : (
              <Button
                variant="ghost"
                className={cn("w-full justify-start", isActive && "bg-accent text-accent-foreground")}
                asChild
              >
                <Link href={item.href} onClick={onClose}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </Button>
            )}
          </div>
        )
      })
  }

  // For mobile, use Sheet component
  if (className?.includes("md:static")) {
    return (
      <>
        <aside className={className}>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between px-4 md:hidden">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold text-xl">
                  The Ark <span className="text-primary">الفلك</span>
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 px-3 py-2">
              <div className="space-y-1">{renderSidebarItems(sidebarItems)}</div>
            </ScrollArea>
          </div>
        </aside>
      </>
    )
  }

  // For desktop
  return (
    <aside className={cn("w-64 border-r bg-background", className)}>
      <ScrollArea className="h-full px-3 py-2">
        <div className="space-y-1">{renderSidebarItems(sidebarItems)}</div>
      </ScrollArea>
    </aside>
  )
}
