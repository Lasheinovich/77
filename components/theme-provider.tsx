"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

type Theme = "light" | "dark" | "system" | string

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: Theme[]
  addCustomTheme: (name: string, properties: Record<string, string>) => void
  removeCustomTheme: (name: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [availableThemes, setAvailableThemes] = useState<Theme[]>(["light", "dark", "system"])
  const [customThemes, setCustomThemes] = useState<Record<string, Record<string, string>>>({})

  const addCustomTheme = (name: string, properties: Record<string, string>) => {
    // Add theme to CSS variables
    const root = document.documentElement
    Object.entries(properties).forEach(([key, value]) => {
      root.style.setProperty(`--${name}-${key}`, value)
    })

    // Add to available themes
    setCustomThemes((prev) => ({ ...prev, [name]: properties }))
    if (!availableThemes.includes(name)) {
      setAvailableThemes((prev) => [...prev, name])
    }
  }

  const removeCustomTheme = (name: string) => {
    // Remove from available themes
    setAvailableThemes((prev) => prev.filter((theme) => theme !== name))

    // Remove from custom themes
    setCustomThemes((prev) => {
      const newThemes = { ...prev }
      delete newThemes[name]
      return newThemes
    })
  }

  // Persist custom themes in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedThemes = localStorage.getItem("ark-custom-themes")
      if (savedThemes) {
        const parsedThemes = JSON.parse(savedThemes)
        setCustomThemes(parsedThemes)

        // Apply saved themes to CSS variables
        Object.entries(parsedThemes).forEach(([themeName, properties]) => {
          const root = document.documentElement
          Object.entries(properties as Record<string, string>).forEach(([key, value]) => {
            root.style.setProperty(`--${themeName}-${key}`, value)
          })
        })

        // Update available themes
        setAvailableThemes((prev) => [...prev, ...Object.keys(parsedThemes)])
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(customThemes).length > 0) {
      localStorage.setItem("ark-custom-themes", JSON.stringify(customThemes))
    }
  }, [customThemes])

  return (
    <ThemeContext.Provider
      value={{
        theme: props.defaultTheme || "system",
        setTheme: () => {}, // This will be overridden by NextThemesProvider
        themes: availableThemes,
        addCustomTheme,
        removeCustomTheme,
      }}
    >
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider")
  }
  return context
}
