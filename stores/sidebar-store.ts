import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SidebarSection } from "@/types/sidebar"
import {
  Home,
  BookOpen,
  ShoppingBag,
  Users,
  MessageSquare,
  Code,
  Settings,
  FileText,
  Layers,
  Brain,
  Palette,
  BarChart,
  Lightbulb,
  Rocket,
  Target,
  Eye,
} from "lucide-react"

interface SidebarState {
  sections: SidebarSection[]
  setSections: (sections: SidebarSection[]) => void
  visibleSections: string[]
  setVisibleSections: (sectionIds: string[]) => void
  pinnedItems: string[]
  setPinnedItems: (itemIds: string[]) => void
  sidebarPosition: "left" | "right"
  setSidebarPosition: (position: "left" | "right") => void
  resetToDefaults: () => void
}

// Default sidebar configuration
const defaultSections: SidebarSection[] = [
  {
    id: "vision",
    label: "Vision",
    labelKey: "vision",
    icon: Eye,
    items: [
      {
        id: "vision-mission",
        label: "Mission & Values",
        labelKey: "mission_values",
        icon: Target,
        href: "/vision/mission",
      },
      {
        id: "vision-goals",
        label: "Strategic Goals",
        labelKey: "strategic_goals",
        icon: Rocket,
        href: "/vision/goals",
      },
      {
        id: "vision-roadmap",
        label: "Roadmap",
        labelKey: "roadmap",
        icon: Lightbulb,
        href: "/vision/roadmap",
      },
    ],
  },
  {
    id: "main",
    label: "Main",
    labelKey: "main",
    icon: Home,
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        labelKey: "dashboard",
        icon: Home,
        href: "/dashboard",
      },
      {
        id: "learn",
        label: "Learn",
        labelKey: "learn",
        icon: BookOpen,
        href: "/learn",
      },
      {
        id: "marketplace",
        label: "Marketplace",
        labelKey: "marketplace",
        icon: ShoppingBag,
        href: "/marketplace",
      },
      {
        id: "community",
        label: "Community",
        labelKey: "community",
        icon: Users,
        href: "/community",
      },
    ],
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    labelKey: "ai_tools",
    icon: Brain,
    items: [
      {
        id: "ai-assistant",
        label: "AI Assistant",
        labelKey: "ai_assistant",
        icon: MessageSquare,
        href: "/ai-assistant",
      },
      {
        id: "coding-playground",
        label: "Coding Playground",
        labelKey: "coding_playground",
        icon: Code,
        href: "/coding-playground",
      },
      {
        id: "document-generator",
        label: "Document Generator",
        labelKey: "document_generator",
        icon: FileText,
        href: "/document-generator",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    labelKey: "tools",
    icon: Layers,
    items: [
      {
        id: "form-generator",
        label: "Form Generator",
        labelKey: "form_generator",
        icon: Layers,
        href: "/tools/form-generator",
      },
      {
        id: "crud-generator",
        label: "CRUD Generator",
        labelKey: "crud_generator",
        icon: Layers,
        href: "/tools/crud-generator",
      },
      {
        id: "ai-form-generator",
        label: "AI Form Generator",
        labelKey: "ai_form_generator",
        icon: Brain,
        href: "/tools/ai-form-generator",
      },
    ],
  },
  {
    id: "var-engine",
    label: "VAR Engine",
    labelKey: "var_engine",
    icon: Palette,
    items: [
      {
        id: "var-models",
        label: "3D Models",
        labelKey: "3d_models",
        icon: Palette,
        href: "/var/models",
      },
      {
        id: "var-model-generator",
        label: "Model Generator",
        labelKey: "model_generator",
        icon: Brain,
        href: "/var/model-generator",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    labelKey: "admin",
    icon: Settings,
    items: [
      {
        id: "admin-dashboard",
        label: "Admin Dashboard",
        labelKey: "admin_dashboard",
        icon: BarChart,
        href: "/admin/dashboard",
      },
      {
        id: "admin-users",
        label: "Users",
        labelKey: "users",
        icon: Users,
        href: "/admin/users",
      },
      {
        id: "admin-plugins",
        label: "Plugins",
        labelKey: "plugins",
        icon: Layers,
        href: "/admin/plugins",
      },
      {
        id: "admin-page-builder",
        label: "Page Builder",
        labelKey: "page_builder",
        icon: Palette,
        href: "/admin/page-builder",
      },
      {
        id: "admin-system-health",
        label: "System Health",
        labelKey: "system_health",
        icon: Settings,
        href: "/admin/system-health",
      },
    ],
  },
]

const defaultVisibleSections = defaultSections.map((section) => section.id)

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      sections: defaultSections,
      setSections: (sections) => set({ sections }),
      visibleSections: defaultVisibleSections,
      setVisibleSections: (sectionIds) => set({ visibleSections: sectionIds }),
      pinnedItems: [],
      setPinnedItems: (itemIds) => set({ pinnedItems: itemIds }),
      sidebarPosition: "left" as const,
      setSidebarPosition: (position) => set({ sidebarPosition: position }),
      resetToDefaults: () =>
        set({
          sections: defaultSections,
          visibleSections: defaultVisibleSections,
          pinnedItems: [],
        }),
    }),
    {
      name: "ark-sidebar-storage",
    },
  ),
)
