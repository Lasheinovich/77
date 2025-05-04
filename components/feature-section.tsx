"use client"

import { useTranslation } from "@/hooks/use-translation"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import {
  Brain,
  Code,
  CuboidIcon as Cube,
  FileText,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  Globe,
  Accessibility,
  BarChart,
  Route,
  Search,
  Sun,
  Bell,
  UserCog,
} from "lucide-react"

export function FeatureSection() {
  const { t } = useTranslation()

  const features = [
    { icon: LayoutDashboard, title: t("admin_panel") },
    { icon: Users, title: t("user_panel") },
    { icon: Brain, title: t("ai_chatbot") },
    { icon: Code, title: t("coding_playground") },
    { icon: Cube, title: t("var_engine") },
    { icon: FileText, title: t("ai_school") },
    { icon: FileText, title: t("certificate_generator") },
    { icon: Cube, title: t("shape_generator") },
    { icon: FileText, title: t("document_generator") },
    { icon: ShoppingCart, title: t("marketplace_logic") },
    { icon: Wallet, title: t("monetization_system") },
    { icon: Globe, title: t("multi_language") },
    { icon: Accessibility, title: t("accessibility_toolkit") },
    { icon: BarChart, title: t("dynamic_dashboard") },
    { icon: Route, title: t("dynamic_routing") },
    { icon: Search, title: t("search_engine") },
    { icon: Sun, title: t("dark_light_mode") },
    { icon: Bell, title: t("notification_system") },
    { icon: UserCog, title: t("multi_role_system") },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t("features_title")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
                    <feature.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
