import type { Metadata } from "next"
import { deploymentManager } from "@/lib/deployment/deployment-config"
import { redirect } from "next/navigation"
import MaintenanceClientPage from "./MaintenanceClientPage"

export const metadata: Metadata = {
  title: "Maintenance - The Ark | الفلك",
  description: "The system is currently undergoing maintenance",
}

export default function MaintenancePage() {
  // If not in maintenance mode, redirect to home
  if (!deploymentManager.isInMaintenanceMode()) {
    redirect("/")
  }

  return <MaintenanceClientPage />
}
