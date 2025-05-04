"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export function MainNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const routes = [
    {
      href: "/",
      label: t("home"),
      active: pathname === "/",
    },
    {
      href: "/learn",
      label: t("learn"),
      active: pathname === "/learn",
    },
    {
      href: "/marketplace",
      label: t("marketplace"),
      active: pathname === "/marketplace",
    },
    {
      href: "/community",
      label: t("community"),
      active: pathname === "/community",
    },
    {
      href: "/ai-assistant",
      label: t("ai_assistant"),
      active: pathname === "/ai-assistant",
    },
  ]

  return (
    <div className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/" className="flex items-center space-x-2">
        <span className="font-bold text-xl">
          The Ark <span className="text-primary">الفلك</span>
        </span>
      </Link>
      <nav className="flex items-center space-x-4 lg:space-x-6">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {route.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center space-x-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  )
}
