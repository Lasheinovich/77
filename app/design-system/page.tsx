"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Copy, Info, Plus } from "lucide-react"

export default function DesignSystemPage() {
  const { t } = useTranslation()
  const [activeColor, setActiveColor] = useState("primary")

  const colors = [
    { name: "primary", value: "hsl(var(--primary))" },
    { name: "secondary", value: "hsl(var(--secondary))" },
    { name: "accent", value: "hsl(var(--accent))" },
    { name: "destructive", value: "hsl(var(--destructive))" },
    { name: "muted", value: "hsl(var(--muted))" },
    { name: "card", value: "hsl(var(--card))" },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">The Ark Design System</h1>
      <p className="text-lg text-muted-foreground mb-8">
        A comprehensive design system for building consistent and accessible user interfaces.
      </p>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Palette</CardTitle>
                <CardDescription>The core colors used throughout the application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {colors.map((color) => (
                    <div
                      key={color.name}
                      className={`p-4 rounded-md cursor-pointer transition-all ${
                        activeColor === color.name ? "ring-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setActiveColor(color.name)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{color.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(`var(--${color.name})`)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color Variations</CardTitle>
                <CardDescription>Shades and tints of the selected color</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    {[100, 200, 300, 400, 500].map((shade) => (
                      <div
                        key={shade}
                        className="h-12 rounded-md flex items-end p-1"
                        style={{ backgroundColor: `hsl(var(--${activeColor}))`, opacity: shade / 500 }}
                      >
                        <span className="text-xs font-medium">{shade}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[600, 700, 800, 900, 950].map((shade) => (
                      <div
                        key={shade}
                        className="h-12 rounded-md flex items-end p-1"
                        style={{ backgroundColor: `hsl(var(--${activeColor}))`, opacity: shade / 1000 }}
                      >
                        <span className="text-xs font-medium">{shade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="typography" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Text styles and hierarchies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-sm font-medium mb-2">Headings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold">Heading 1</h1>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-4xl font-bold")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Heading 2</h2>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-3xl font-bold")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Heading 3</h3>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-2xl font-bold")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold">Heading 4</h4>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-xl font-bold")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-bold">Heading 5</h5>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-lg font-bold")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Body Text</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg">Large Text</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-lg")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p>Regular Text</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-base")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Small Text</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-sm")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs">Extra Small Text</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("text-xs")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Button variants and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Variants</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Sizes</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button size="lg">Large</Button>
                    <Button>Default</Button>
                    <Button size="sm">Small</Button>
                    <Button size="icon" className="h-10 w-10">
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">States</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled>Disabled</Button>
                    <Button>
                      <Check className="mr-2 h-4 w-4" /> With Icon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Input components and controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input">Input</Label>
                  <Input id="input" placeholder="Enter text..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textarea">Textarea</Label>
                  <Textarea id="textarea" placeholder="Enter multiple lines..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="select">Select</Label>
                  <Select>
                    <SelectTrigger id="select">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="checkbox" />
                  <Label htmlFor="checkbox">Checkbox</Label>
                </div>
                <div className="space-y-2">
                  <Label>Radio Group</Label>
                  <RadioGroup defaultValue="option1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="option1" />
                      <Label htmlFor="option1">Option 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="option2" />
                      <Label htmlFor="option2">Option 2</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Switch</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="switch" />
                    <Label htmlFor="switch">Toggle</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slider</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>Alerts, badges, and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Alerts</h3>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>This is an informational alert.</AlertDescription>
                  </Alert>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Layout</CardTitle>
                <CardDescription>Cards, separators, and containers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Card</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Title</CardTitle>
                      <CardDescription>Card description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Card content goes here.</p>
                    </CardContent>
                    <CardFooter>
                      <Button>Action</Button>
                    </CardFooter>
                  </Card>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Separator</h3>
                  <div className="space-y-2">
                    <p>Content above</p>
                    <Separator />
                    <p>Content below</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Patterns</CardTitle>
              <CardDescription>Common UI patterns and best practices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Form Layout</h3>
                <div className="border rounded-lg p-4">
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input id="first-name" placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" placeholder="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john.doe@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Enter your message..." />
                    </div>
                    <Button>Submit</Button>
                  </form>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Card Grid</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle>Card {i}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>This is an example of a card grid layout.</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Dashboard Layout</h3>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Main Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-40 border-2 border-dashed rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">Main content area</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Sidebar</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-40 border-2 border-dashed rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">Sidebar content</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Guidelines</CardTitle>
              <CardDescription>Best practices for creating accessible interfaces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Color Contrast</h3>
                <p className="mb-4">
                  Ensure text has sufficient contrast against its background to be readable by people with visual
                  impairments.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary text-primary-foreground rounded-md">
                    <p className="font-medium">Good Contrast</p>
                    <p>This text has good contrast against the background.</p>
                  </div>
                  <div className="p-4 bg-muted text-muted-foreground rounded-md">
                    <p className="font-medium">Good Contrast</p>
                    <p>This text has good contrast against the background.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Keyboard Navigation</h3>
                <p className="mb-4">Ensure all interactive elements are accessible via keyboard navigation.</p>
                <div className="p-4 border rounded-md">
                  <div className="flex flex-wrap gap-2">
                    <Button>Tab through</Button>
                    <Button>These</Button>
                    <Button>Buttons</Button>
                    <Button>Using</Button>
                    <Button>Keyboard</Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Screen Reader Support</h3>
                <p className="mb-4">Use proper ARIA attributes and semantic HTML to support screen readers.</p>
                <div className="p-4 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <Button aria-label="Add item">
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add item</span>
                    </Button>
                    <p>This button has an aria-label and screen reader text.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Focus Indicators</h3>
                <p className="mb-4">Ensure focus indicators are visible for keyboard navigation.</p>
                <div className="p-4 border rounded-md">
                  <p className="mb-2">Tab to the button below to see the focus indicator:</p>
                  <Button>Focus Me</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
