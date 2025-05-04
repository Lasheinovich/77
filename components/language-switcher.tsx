"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
}: { variant?: "ghost" | "outline"; size?: "sm" | "default" }) {
  const { language, setLanguage, availableLanguages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = availableLanguages.find((lang) => lang.code === language)

  // Group languages by region for better organization
  const regions = {
    "Middle East & Africa": ["ar"],
    Europe: ["en", "fr", "es", "pt", "de", "ru"],
    Asia: ["zh", "hi", "ja"],
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage?.nativeName || "English"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(regions).map(([region, langCodes]) => (
          <div key={region}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">{region}</DropdownMenuLabel>
            {availableLanguages
              .filter((lang) => langCodes.includes(lang.code))
              .map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  className={cn("flex items-center justify-between", lang.code === language && "bg-accent")}
                  onClick={() => {
                    setLanguage(lang.code)
                    setIsOpen(false)
                  }}
                >
                  <span className="flex items-center">{lang.nativeName}</span>
                </DropdownMenuItem>
              ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
