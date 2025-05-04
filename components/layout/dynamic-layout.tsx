"use client"

import type React from "react"
import Head from "next/head"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  title?: string
  description?: string
  image?: string
  maxWidth?: string
  customClass?: string
}

export function DynamicLayout({
  children,
  title = "The Ark | الفلك",
  description = "Universal AI Web System for Learning, Business, and Community",
  image = "/og.png",
  maxWidth = "max-w-4xl",
  customClass,
}: Props) {
  const pathname = usePathname()
  const { theme } = useTheme()

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}${image}?theme=${theme}`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL}${pathname}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <main className={cn("container mx-auto flex-1 py-8", maxWidth && maxWidth, customClass)}>{children}</main>
      </div>
    </>
  )
}
