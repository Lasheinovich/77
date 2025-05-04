import type { LucideIcon } from "lucide-react"

export interface SidebarItem {
  id: string
  label: string
  labelKey?: string
  icon?: LucideIcon
  href: string
}

export interface SidebarSection {
  id: string
  label: string
  labelKey?: string
  icon?: LucideIcon
  items: SidebarItem[]
}
