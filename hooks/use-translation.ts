"use client"

import { useLanguage } from "@/components/language-provider"
import translations from "@/lib/translations"

export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: string, params?: Record<string, string>) => {
    let text = translations[language][key] || key

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{{${paramKey}}}`, paramValue)
      })
    }

    return text
  }

  return { t }
}
