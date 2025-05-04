import { create } from "zustand"

interface AdminState {
  dashboardWidgets: string[]
  setDashboardWidgets: (widgets: string[]) => void
  features: Record<string, boolean>
  toggleFeature: (feature: string) => void
  systemStatus: {
    health: "healthy" | "degraded" | "critical"
    uptime: number
    activeUsers: number
    userGrowth: number
    aiOperations: number
    systemLoad: number
  }
  refreshSystemStatus: () => void
}

export const useAdminStore = create<AdminState>()((set) => ({
  dashboardWidgets: [],
  setDashboardWidgets: (dashboardWidgets) => set({ dashboardWidgets }),
  features: {
    aiAssistant: true,
    codePlayground: true,
    marketplace: true,
    adminPanel: true,
  },
  toggleFeature: (feature) =>
    set((state) => ({
      features: {
        ...state.features,
        [feature]: !state.features[feature],
      },
    })),
  systemStatus: {
    health: "healthy",
    uptime: 99.9,
    activeUsers: 1234,
    userGrowth: 5,
    aiOperations: 5678,
    systemLoad: 30,
  },
  refreshSystemStatus: () => {
    // Simulate fetching system status
    setTimeout(() => {
      set({
        systemStatus: {
          health: Math.random() > 0.2 ? "healthy" : "degraded",
          uptime: 99.9,
          activeUsers: Math.floor(Math.random() * 2000),
          userGrowth: Math.floor(Math.random() * 20) - 10,
          aiOperations: Math.floor(Math.random() * 10000),
          systemLoad: Math.floor(Math.random() * 100),
        },
      })
    }, 500)
  },
}))
