"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { logger } from "@/lib/logger"

type Language = "en" | "ar" | "fr" | "es" | "zh" | "ru" | "hi" | "pt" | "de" | "ja"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  dir: "ltr" | "rtl"
  availableLanguages: Array<{
    code: Language
    name: string
    nativeName: string
    dir: "ltr" | "rtl"
  }>
  isRTL: boolean
}

const availableLanguages = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" as const },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" as const },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" as const },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" as const },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr" as const },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" as const },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" as const },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" as const },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" as const },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" as const },
]

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useLocalStorage<Language>("language", "en")
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr")

  const isRTL = dir === "rtl"

  const setLanguage = (newLanguage: Language) => {
    try {
      const langInfo = availableLanguages.find((l) => l.code === newLanguage)
      if (!langInfo) {
        throw new Error(`Language ${newLanguage} not supported`)
      }

      setLanguageState(newLanguage)
      setDir(langInfo.dir)
      document.documentElement.lang = newLanguage
      document.documentElement.dir = langInfo.dir

      logger.info(`Language changed to ${newLanguage}`, {
        previousLanguage: language,
        newLanguage,
        dir: langInfo.dir,
      })
    } catch (error) {
      logger.error(`Failed to set language to ${newLanguage}`, { error })
      // Fallback to English
      setLanguageState("en")
      setDir("ltr")
      document.documentElement.lang = "en"
      document.documentElement.dir = "ltr"
    }
  }

  useEffect(() => {
    const langInfo = availableLanguages.find((l) => l.code === language)
    if (langInfo) {
      setDir(langInfo.dir)
      document.documentElement.lang = language
      document.documentElement.dir = langInfo.dir
    }
  }, [language])

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dir,
        availableLanguages,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
