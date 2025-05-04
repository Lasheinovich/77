"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { Type, Eye, MousePointer, Pause, RotateCcw, Check } from "lucide-react"

export function AccessibilitySettings() {
  const { t } = useTranslation()
  const [fontSize, setFontSize] = useLocalStorage<number>("ark-a11y-font-size", 100)
  const [contrast, setContrast] = useLocalStorage<string>("ark-a11y-contrast", "normal")
  const [reducedMotion, setReducedMotion] = useLocalStorage<boolean>("ark-a11y-reduced-motion", false)
  const [highContrast, setHighContrast] = useLocalStorage<boolean>("ark-a11y-high-contrast", false)
  const [dyslexicFont, setDyslexicFont] = useLocalStorage<boolean>("ark-a11y-dyslexic-font", false)
  const [screenReader, setScreenReader] = useLocalStorage<boolean>("ark-a11y-screen-reader", false)
  const [bigCursor, setBigCursor] = useLocalStorage<boolean>("ark-a11y-big-cursor", false)
  const [keyboardNavigation, setKeyboardNavigation] = useLocalStorage<boolean>("ark-a11y-keyboard-nav", false)
  const [lineHeight, setLineHeight] = useLocalStorage<number>("ark-a11y-line-height", 1.5)
  const [letterSpacing, setLetterSpacing] = useLocalStorage<number>("ark-a11y-letter-spacing", 0)
  const [wordSpacing, setWordSpacing] = useLocalStorage<number>("ark-a11y-word-spacing", 0)
  const [colorScheme, setColorScheme] = useLocalStorage<string>("ark-a11y-color-scheme", "default")
  const [focusIndicator, setFocusIndicator] = useLocalStorage<boolean>("ark-a11y-focus-indicator", false)
  const [animations, setAnimations] = useLocalStorage<string>("ark-a11y-animations", "default")
  const [fontFamily, setFontFamily] = useLocalStorage<string>("ark-a11y-font-family", "default")
  const [showChanges, setShowChanges] = useState(false)

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement

    // Font size
    root.style.setProperty("--a11y-font-size-factor", `${fontSize / 100}`)

    // Line height
    root.style.setProperty("--a11y-line-height", `${lineHeight}`)

    // Letter spacing
    root.style.setProperty("--a11y-letter-spacing", `${letterSpacing}px`)

    // Word spacing
    root.style.setProperty("--a11y-word-spacing", `${wordSpacing}px`)

    // Contrast
    document.body.classList.remove("a11y-high-contrast", "a11y-low-contrast")
    if (contrast !== "normal") {
      document.body.classList.add(`a11y-${contrast}-contrast`)
    }

    // Reduced motion
    if (reducedMotion) {
      root.style.setProperty("--a11y-reduced-motion", "none")
    } else {
      root.style.removeProperty("--a11y-reduced-motion")
    }

    // Dyslexic font
    if (dyslexicFont) {
      document.body.classList.add("a11y-dyslexic-font")
    } else {
      document.body.classList.remove("a11y-dyslexic-font")
    }

    // Big cursor
    if (bigCursor) {
      document.body.classList.add("a11y-big-cursor")
    } else {
      document.body.classList.remove("a11y-big-cursor")
    }

    // Keyboard navigation
    if (keyboardNavigation) {
      document.body.classList.add("a11y-keyboard-nav")
    } else {
      document.body.classList.remove("a11y-keyboard-nav")
    }

    // Color scheme
    document.body.classList.remove(
      "a11y-color-scheme-high-contrast",
      "a11y-color-scheme-dark-high-contrast",
      "a11y-color-scheme-yellow-black",
      "a11y-color-scheme-black-yellow",
    )
    if (colorScheme !== "default") {
      document.body.classList.add(`a11y-color-scheme-${colorScheme}`)
    }

    // Focus indicator
    if (focusIndicator) {
      document.body.classList.add("a11y-focus-indicator")
    } else {
      document.body.classList.remove("a11y-focus-indicator")
    }

    // Animations
    root.style.setProperty("--a11y-animations", animations)

    // Font family
    document.body.classList.remove(
      "a11y-font-sans",
      "a11y-font-serif",
      "a11y-font-mono",
      "a11y-font-dyslexic",
      "a11y-font-readable",
    )
    if (fontFamily !== "default") {
      document.body.classList.add(`a11y-font-${fontFamily}`)
    }
  }, [
    fontSize,
    contrast,
    reducedMotion,
    dyslexicFont,
    bigCursor,
    keyboardNavigation,
    lineHeight,
    letterSpacing,
    wordSpacing,
    colorScheme,
    focusIndicator,
    animations,
    fontFamily,
  ])

  const resetSettings = () => {
    setFontSize(100)
    setContrast("normal")
    setReducedMotion(false)
    setHighContrast(false)
    setDyslexicFont(false)
    setScreenReader(false)
    setBigCursor(false)
    setKeyboardNavigation(false)
    setLineHeight(1.5)
    setLetterSpacing(0)
    setWordSpacing(0)
    setColorScheme("default")
    setFocusIndicator(false)
    setAnimations("default")
    setFontFamily("default")

    // Show confirmation
    setShowChanges(true)
    setTimeout(() => setShowChanges(false), 3000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("accessibility_settings")}</CardTitle>
        <CardDescription>{t("accessibility_settings_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span>{t("text")}</span>
            </TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{t("vision")}</span>
            </TabsTrigger>
            <TabsTrigger value="motion" className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              <span>{t("motion")}</span>
            </TabsTrigger>
            <TabsTrigger value="input" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              <span>{t("input")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size">
                  {t("font_size")} ({fontSize}%)
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setFontSize(Math.max(70, fontSize - 10))}
                    aria-label={t("decrease_font_size")}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setFontSize(Math.min(200, fontSize + 10))}
                    aria-label={t("increase_font_size")}
                  >
                    +
                  </Button>
                </div>
              </div>
              <Slider
                id="font-size"
                min={70}
                max={200}
                step={10}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line-height">
                {t("line_height")} ({lineHeight})
              </Label>
              <Slider
                id="line-height"
                min={1}
                max={3}
                step={0.1}
                value={[lineHeight]}
                onValueChange={(value) => setLineHeight(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="letter-spacing">
                {t("letter_spacing")} ({letterSpacing}px)
              </Label>
              <Slider
                id="letter-spacing"
                min={0}
                max={10}
                step={0.5}
                value={[letterSpacing]}
                onValueChange={(value) => setLetterSpacing(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="word-spacing">
                {t("word_spacing")} ({wordSpacing}px)
              </Label>
              <Slider
                id="word-spacing"
                min={0}
                max={10}
                step={0.5}
                value={[wordSpacing]}
                onValueChange={(value) => setWordSpacing(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-family">{t("font_family")}</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger id="font-family">
                  <SelectValue placeholder={t("select_font_family")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("default")}</SelectItem>
                  <SelectItem value="sans">{t("sans_serif")}</SelectItem>
                  <SelectItem value="serif">{t("serif")}</SelectItem>
                  <SelectItem value="mono">{t("monospace")}</SelectItem>
                  <SelectItem value="dyslexic">{t("dyslexic_friendly")}</SelectItem>
                  <SelectItem value="readable">{t("highly_readable")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="dyslexic-font" checked={dyslexicFont} onCheckedChange={setDyslexicFont} />
              <Label htmlFor="dyslexic-font">{t("dyslexia_friendly_font")}</Label>
            </div>
          </TabsContent>

          <TabsContent value="vision" className="space-y-6">
            <div className="space-y-2">
              <Label>{t("contrast")}</Label>
              <RadioGroup value={contrast} onValueChange={setContrast} className="grid grid-cols-3 gap-2">
                <div>
                  <RadioGroupItem value="normal" id="contrast-normal" className="sr-only" />
                  <Label
                    htmlFor="contrast-normal"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                      contrast === "normal" && "border-primary",
                    )}
                  >
                    <span>{t("normal")}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="high" id="contrast-high" className="sr-only" />
                  <Label
                    htmlFor="contrast-high"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                      contrast === "high" && "border-primary",
                    )}
                  >
                    <span>{t("high")}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="low" id="contrast-low" className="sr-only" />
                  <Label
                    htmlFor="contrast-low"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                      contrast === "low" && "border-primary",
                    )}
                  >
                    <span>{t("low")}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-scheme">{t("color_scheme")}</Label>
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger id="color-scheme">
                  <SelectValue placeholder={t("select_color_scheme")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("default")}</SelectItem>
                  <SelectItem value="high-contrast">{t("high_contrast")}</SelectItem>
                  <SelectItem value="dark-high-contrast">{t("dark_high_contrast")}</SelectItem>
                  <SelectItem value="yellow-black">{t("yellow_on_black")}</SelectItem>
                  <SelectItem value="black-yellow">{t("black_on_yellow")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="focus-indicator" checked={focusIndicator} onCheckedChange={setFocusIndicator} />
              <Label htmlFor="focus-indicator">{t("enhanced_focus_indicators")}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="screen-reader" checked={screenReader} onCheckedChange={setScreenReader} />
              <Label htmlFor="screen-reader">{t("screen_reader_mode")}</Label>
            </div>
          </TabsContent>

          <TabsContent value="motion" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="animations">{t("animation_preference")}</Label>
              <Select value={animations} onValueChange={setAnimations}>
                <SelectTrigger id="animations">
                  <SelectValue placeholder={t("select_animation_preference")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("default")}</SelectItem>
                  <SelectItem value="reduced">{t("reduced")}</SelectItem>
                  <SelectItem value="minimal">{t("minimal")}</SelectItem>
                  <SelectItem value="none">{t("none")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="reduced-motion" checked={reducedMotion} onCheckedChange={setReducedMotion} />
              <Label htmlFor="reduced-motion">{t("reduce_animations")}</Label>
            </div>
          </TabsContent>

          <TabsContent value="input" className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch id="big-cursor" checked={bigCursor} onCheckedChange={setBigCursor} />
              <Label htmlFor="big-cursor">{t("larger_cursor")}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="keyboard-nav" checked={keyboardNavigation} onCheckedChange={setKeyboardNavigation} />
              <Label htmlFor="keyboard-nav">{t("enhanced_keyboard_navigation")}</Label>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetSettings} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          {t("reset_to_defaults")}
        </Button>

        {showChanges && (
          <div className="flex items-center text-sm text-green-600 dark:text-green-500">
            <Check className="mr-1 h-4 w-4" />
            {t("settings_updated")}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
