"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { Accessibility, Type, MousePointer, Pause, Eye } from "lucide-react"

interface AccessibilityToolbarProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  showLabel?: boolean
}

export function AccessibilityToolbar({ position = "bottom-right", showLabel = true }: AccessibilityToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useLocalStorage<number>("ark-a11y-font-size", 100)
  const [contrast, setContrast] = useLocalStorage<string>("ark-a11y-contrast", "normal")
  const [reducedMotion, setReducedMotion] = useLocalStorage<boolean>("ark-a11y-reduced-motion", false)
  const [highContrast, setHighContrast] = useLocalStorage<boolean>("ark-a11y-high-contrast", false)
  const [dyslexicFont, setDyslexicFont] = useLocalStorage<boolean>("ark-a11y-dyslexic-font", false)
  const [screenReader, setScreenReader] = useLocalStorage<boolean>("ark-a11y-screen-reader", false)
  const [bigCursor, setBigCursor] = useLocalStorage<boolean>("ark-a11y-big-cursor", false)
  const [keyboardNavigation, setKeyboardNavigation] = useLocalStorage<boolean>("ark-a11y-keyboard-nav", false)

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement

    // Font size
    root.style.setProperty("--a11y-font-size-factor", `${fontSize / 100}`)

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
  }, [fontSize, contrast, reducedMotion, dyslexicFont, bigCursor, keyboardNavigation])

  // Position classes
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  }

  const resetSettings = () => {
    setFontSize(100)
    setContrast("normal")
    setReducedMotion(false)
    setHighContrast(false)
    setDyslexicFont(false)
    setScreenReader(false)
    setBigCursor(false)
    setKeyboardNavigation(false)
  }

  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={showLabel ? "default" : "icon"}
            className="bg-background/80 backdrop-blur-sm"
            aria-label="Accessibility options"
          >
            <Accessibility className="h-4 w-4 mr-2" />
            {showLabel && "Accessibility"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Accessibility Tools</h3>
              <Button variant="ghost" size="sm" onClick={resetSettings}>
                Reset
              </Button>
            </div>

            <Tabs defaultValue="text">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="text">
                  <Type className="h-4 w-4" />
                  <span className="sr-only">Text</span>
                </TabsTrigger>
                <TabsTrigger value="vision">
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Vision</span>
                </TabsTrigger>
                <TabsTrigger value="motion">
                  <Pause className="h-4 w-4" />
                  <span className="sr-only">Motion</span>
                </TabsTrigger>
                <TabsTrigger value="input">
                  <MousePointer className="h-4 w-4" />
                  <span className="sr-only">Input</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="font-size">Font Size ({fontSize}%)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setFontSize(Math.max(70, fontSize - 10))}
                        aria-label="Decrease font size"
                      >
                        -
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setFontSize(Math.min(200, fontSize + 10))}
                        aria-label="Increase font size"
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

                <div className="flex items-center space-x-2">
                  <Switch id="dyslexic-font" checked={dyslexicFont} onCheckedChange={setDyslexicFont} />
                  <Label htmlFor="dyslexic-font">Dyslexia-friendly Font</Label>
                </div>
              </TabsContent>

              <TabsContent value="vision" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Contrast</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={contrast === "normal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContrast("normal")}
                    >
                      Normal
                    </Button>
                    <Button
                      variant={contrast === "high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContrast("high")}
                    >
                      High
                    </Button>
                    <Button
                      variant={contrast === "low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContrast("low")}
                    >
                      Low
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="screen-reader" checked={screenReader} onCheckedChange={setScreenReader} />
                  <Label htmlFor="screen-reader">Screen Reader Mode</Label>
                </div>
              </TabsContent>

              <TabsContent value="motion" className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch id="reduced-motion" checked={reducedMotion} onCheckedChange={setReducedMotion} />
                  <Label htmlFor="reduced-motion">Reduce Animations</Label>
                </div>
              </TabsContent>

              <TabsContent value="input" className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch id="big-cursor" checked={bigCursor} onCheckedChange={setBigCursor} />
                  <Label htmlFor="big-cursor">Larger Cursor</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="keyboard-nav" checked={keyboardNavigation} onCheckedChange={setKeyboardNavigation} />
                  <Label htmlFor="keyboard-nav">Enhanced Keyboard Navigation</Label>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
