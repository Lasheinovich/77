"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/hooks/use-translation"
import { AIUIAssistant } from "@/components/ai-ui-assistant/ai-ui-assistant"
import { LoadingSpinner } from "@/components/loading-spinner"
import { redirect } from "next/navigation"
import {
  Layout,
  Layers,
  Save,
  Eye,
  Code,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Type,
  ImageIcon,
  FileText,
  Table,
  BarChart,
  FormInput,
  ListOrdered,
  Grid,
  Columns,
  X,
} from "lucide-react"

export default function PageBuilderPage() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [pageTitle, setPageTitle] = useState("New Page")
  const [pageSlug, setPageSlug] = useState("new-page")
  const [pageDescription, setPageDescription] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [components, setComponents] = useState<any[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  const componentTypes = [
    { id: "heading", name: "Heading", icon: Type },
    { id: "text", name: "Text Block", icon: FileText },
    { id: "image", name: "Image", icon: ImageIcon },
    { id: "button", name: "Button", icon: FormInput },
    { id: "card", name: "Card", icon: Layout },
    { id: "grid", name: "Grid", icon: Grid },
    { id: "columns", name: "Columns", icon: Columns },
    { id: "list", name: "List", icon: ListOrdered },
    { id: "table", name: "Table", icon: Table },
    { id: "chart", name: "Chart", icon: BarChart },
    { id: "form", name: "Form", icon: FormInput },
    { id: "custom", name: "Custom Component", icon: Code },
  ]

  const addComponent = (type: string) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type,
      props: getDefaultPropsForType(type),
      children: type === "grid" || type === "columns" ? [] : undefined,
    }

    setComponents([...components, newComponent])
    setSelectedComponent(newComponent.id)

    toast({
      title: "Component Added",
      description: `Added a new ${type} component to the page.`,
    })
  }

  const getDefaultPropsForType = (type: string) => {
    switch (type) {
      case "heading":
        return { text: "New Heading", level: "h2", className: "" }
      case "text":
        return { text: "Enter your text here...", className: "" }
      case "image":
        return { src: "/colorful-abstract-flow.png", alt: "Image description", className: "" }
      case "button":
        return { text: "Button", variant: "default", size: "default", className: "" }
      case "card":
        return { title: "Card Title", description: "Card description", className: "" }
      case "grid":
        return { columns: 3, gap: 4, className: "" }
      case "columns":
        return { count: 2, gap: 4, className: "" }
      case "list":
        return { items: ["Item 1", "Item 2", "Item 3"], ordered: false, className: "" }
      case "table":
        return {
          headers: ["Header 1", "Header 2", "Header 3"],
          rows: [
            ["Row 1, Cell 1", "Row 1, Cell 2", "Row 1, Cell 3"],
            ["Row 2, Cell 1", "Row 2, Cell 2", "Row 2, Cell 3"],
          ],
          className: "",
        }
      case "chart":
        return { type: "bar", data: {}, className: "" }
      case "form":
        return { fields: [], submitText: "Submit", className: "" }
      case "custom":
        return { code: "<div>Custom component</div>", className: "" }
      default:
        return {}
    }
  }

  const updateComponent = (id: string, props: any) => {
    setComponents(
      components.map((component) =>
        component.id === id ? { ...component, props: { ...component.props, ...props } } : component,
      ),
    )
  }

  const deleteComponent = (id: string) => {
    setComponents(components.filter((component) => component.id !== id))
    setSelectedComponent(null)

    toast({
      title: "Component Deleted",
      description: "The component has been removed from the page.",
    })
  }

  const duplicateComponent = (id: string) => {
    const componentToDuplicate = components.find((component) => component.id === id)
    if (componentToDuplicate) {
      const newComponent = {
        ...componentToDuplicate,
        id: `component-${Date.now()}`,
      }
      setComponents([...components, newComponent])
      setSelectedComponent(newComponent.id)

      toast({
        title: "Component Duplicated",
        description: "A copy of the component has been created.",
      })
    }
  }

  const moveComponent = (id: string, direction: "up" | "down") => {
    const index = components.findIndex((component) => component.id === id)
    if ((direction === "up" && index > 0) || (direction === "down" && index < components.length - 1)) {
      const newComponents = [...components]
      const newIndex = direction === "up" ? index - 1 : index + 1
      const [removed] = newComponents.splice(index, 1)
      newComponents.splice(newIndex, 0, removed)
      setComponents(newComponents)
    }
  }

  const savePage = () => {
    // In a real implementation, this would save to a database
    toast({
      title: "Page Saved",
      description: `The page "${pageTitle}" has been saved successfully.`,
    })

    // For demo purposes, we'll just log the page data
    console.log({
      title: pageTitle,
      slug: pageSlug,
      description: pageDescription,
      isPublished,
      components,
    })
  }

  const previewPage = () => {
    setPreviewMode(!previewMode)
    setActiveTab(previewMode ? "editor" : "preview")
  }

  const generateAIContent = async () => {
    toast({
      title: "Generating Content",
      description: "AI is generating content based on your page structure...",
    })

    // This would be implemented with the AI SDK in a real application
    setTimeout(() => {
      toast({
        title: "Content Generated",
        description: "AI has generated content for your page.",
      })

      // For demo purposes, we'll update some components with "AI-generated" content
      setComponents(
        components.map((component) => {
          if (component.type === "heading") {
            return {
              ...component,
              props: {
                ...component.props,
                text: "AI-Generated Heading",
              },
            }
          }
          if (component.type === "text") {
            return {
              ...component,
              props: {
                ...component.props,
                text: "This is AI-generated text content that demonstrates the capabilities of The Ark's AI content generation system. The content is tailored to match your page's purpose and structure.",
              },
            }
          }
          return component
        }),
      )
    }, 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar - Component palette */}
      <div className="w-64 border-r bg-muted/40 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Components</h2>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab("editor")}>
            <Layers className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {componentTypes.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              className="h-auto py-4 justify-start flex-col items-center"
              onClick={() => addComponent(type.id)}
            >
              <type.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{type.name}</span>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="page-title">Page Title</Label>
            <Input id="page-title" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page-slug">Page Slug</Label>
            <Input id="page-slug" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page-description">Description</Label>
            <Textarea
              id="page-description"
              value={pageDescription}
              onChange={(e) => setPageDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
            <Label htmlFor="published">Published</Label>
          </div>

          <div className="flex space-x-2">
            <Button className="flex-1" onClick={savePage}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" className="flex-1" onClick={previewPage}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          <Button variant="secondary" className="w-full" onClick={generateAIContent}>
            <Wand2 className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-4 bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="editor" className="p-4 h-full">
            {components.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Components Added</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Start building your page by adding components from the sidebar.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {componentTypes.slice(0, 4).map((type) => (
                    <Button key={type.id} variant="outline" size="sm" onClick={() => addComponent(type.id)}>
                      <type.icon className="h-4 w-4 mr-2" />
                      Add {type.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {components.map((component) => (
                  <ComponentEditor
                    key={component.id}
                    component={component}
                    isSelected={selectedComponent === component.id}
                    onSelect={() => setSelectedComponent(component.id)}
                    onUpdate={(props) => updateComponent(component.id, props)}
                    onDelete={() => deleteComponent(component.id)}
                    onDuplicate={() => duplicateComponent(component.id)}
                    onMove={(direction) => moveComponent(component.id, direction)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="h-full">
            <div className="h-full overflow-auto p-4 bg-background">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>
                {components.map((component) => (
                  <ComponentRenderer key={component.id} component={component} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="h-full">
            <div className="h-full overflow-auto p-4 bg-muted/20">
              <pre className="p-4 rounded-lg bg-card overflow-auto">
                <code>{JSON.stringify({ pageTitle, pageSlug, components }, null, 2)}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-4 h-full">
            <Card>
              <CardHeader>
                <CardTitle>Page Settings</CardTitle>
                <CardDescription>Configure advanced settings for this page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input id="meta-title" placeholder="SEO title (leave blank to use page title)" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <Textarea id="meta-description" placeholder="SEO description" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page-layout">Page Layout</Label>
                  <Select defaultValue="default">
                    <SelectTrigger id="page-layout">
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="full-width">Full Width</SelectItem>
                      <SelectItem value="sidebar">With Sidebar</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Access Control</Label>
                  <Select defaultValue="public">
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="registered">Registered Users</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Advanced Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="enable-comments" />
                      <Label htmlFor="enable-comments">Enable Comments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="show-author" />
                      <Label htmlFor="show-author">Show Author</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="show-date" />
                      <Label htmlFor="show-date">Show Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="indexable" defaultChecked />
                      <Label htmlFor="indexable">Allow Search Engines</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={savePage}>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </div>

      {/* Right sidebar - Properties panel */}
      {selectedComponent && (
        <div className="w-80 border-l bg-muted/40 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Properties</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedComponent(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ComponentProperties
            component={components.find((c) => c.id === selectedComponent)!}
            onUpdate={(props) => updateComponent(selectedComponent, props)}
          />

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => duplicateComponent(selectedComponent)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => deleteComponent(selectedComponent)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => moveComponent(selectedComponent, "up")}
              >
                <ChevronUp className="h-4 w-4 mr-2" />
                Move Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => moveComponent(selectedComponent, "down")}
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Move Down
              </Button>
            </div>
          </div>
        </div>
      )}

      <AIUIAssistant pageContext="page-builder" userRole="admin" />
    </div>
  )
}

// Helper components
function ComponentEditor({ component, isSelected, onSelect, onUpdate, onDelete, onDuplicate, onMove }: any) {
  return (
    <div
      className={`border rounded-lg p-4 ${isSelected ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="font-medium capitalize">{component.type}</span>
          {component.props.text && (
            <span className="ml-2 text-sm text-muted-foreground truncate max-w-[200px]">{component.props.text}</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove("up")}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove("down")}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ComponentRenderer component={component} isEditor />
    </div>
  )
}

function ComponentRenderer({ component, isEditor = false }: any) {
  const { type, props } = component

  switch (type) {
    case "heading":
      const HeadingTag = props.level || "h2"
      return <HeadingTag className={props.className}>{props.text}</HeadingTag>

    case "text":
      return <p className={props.className}>{props.text}</p>

    case "image":
      return (
        <ImageIcon
          src={props.src || "/placeholder.svg"}
          alt={props.alt}
          className={cn("max-w-full h-auto", props.className)}
        />
      )

    case "button":
      return (
        <Button variant={props.variant} size={props.size} className={props.className}>
          {props.text}
        </Button>
      )

    case "card":
      return (
        <Card className={props.className}>
          {props.title && (
            <CardHeader>
              <CardTitle>{props.title}</CardTitle>
              {props.description && <CardDescription>{props.description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            {props.content || (isEditor && <p className="text-muted-foreground">Card content</p>)}
          </CardContent>
        </Card>
      )

    case "grid":
      return (
        <div className={cn(`grid grid-cols-${props.columns} gap-${props.gap}`, props.className)}>
          {component.children?.map((child: any) => (
            <ComponentRenderer key={child.id} component={child} isEditor={isEditor} />
          )) ||
            (isEditor && (
              <>
                <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground">Grid Item 1</div>
                <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground">Grid Item 2</div>
                <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground">Grid Item 3</div>
              </>
            ))}
        </div>
      )

    case "list":
      if (props.ordered) {
        return (
          <ol className={cn("list-decimal pl-5", props.className)}>
            {props.items.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        )
      }
      return (
        <ul className={cn("list-disc pl-5", props.className)}>
          {props.items.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case "table":
      return (
        <div className="overflow-x-auto">
          <table className={cn("w-full border-collapse", props.className)}>
            <thead>
              <tr>
                {props.headers.map((header: string, i: number) => (
                  <th key={i} className="border p-2 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row: string[], i: number) => (
                <tr key={i}>
                  {row.map((cell: string, j: number) => (
                    <td key={j} className="border p-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "custom":
      if (isEditor) {
        return (
          <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground">
            Custom Component (Preview Not Available)
          </div>
        )
      }
      // In a real implementation, this would use a safe way to render custom HTML
      return <div dangerouslySetInnerHTML={{ __html: props.code }} />

    default:
      return (
        <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground">
          Unknown Component Type: {type}
        </div>
      )
  }
}

function ComponentProperties({ component, onUpdate }: any) {
  const { type, props } = component

  switch (type) {
    case "heading":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heading-text">Text</Label>
            <Textarea
              id="heading-text"
              value={props.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heading-level">Level</Label>
            <Select value={props.level} onValueChange={(value) => onUpdate({ level: value })}>
              <SelectTrigger id="heading-level">
                <SelectValue placeholder="Select heading level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1</SelectItem>
                <SelectItem value="h2">H2</SelectItem>
                <SelectItem value="h3">H3</SelectItem>
                <SelectItem value="h4">H4</SelectItem>
                <SelectItem value="h5">H5</SelectItem>
                <SelectItem value="h6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heading-class">CSS Class</Label>
            <Input
              id="heading-class"
              value={props.className}
              onChange={(e) => onUpdate({ className: e.target.value })}
              placeholder="e.g. text-center text-primary"
            />
          </div>
        </div>
      )

    case "text":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-content">Text Content</Label>
            <Textarea
              id="text-content"
              value={props.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-class">CSS Class</Label>
            <Input
              id="text-class"
              value={props.className}
              onChange={(e) => onUpdate({ className: e.target.value })}
              placeholder="e.g. text-lg text-muted-foreground"
            />
          </div>
        </div>
      )

    case "image":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-src">Image Source</Label>
            <Input id="image-src" value={props.src} onChange={(e) => onUpdate({ src: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input id="image-alt" value={props.alt} onChange={(e) => onUpdate({ alt: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-class">CSS Class</Label>
            <Input
              id="image-class"
              value={props.className}
              onChange={(e) => onUpdate({ className: e.target.value })}
              placeholder="e.g. rounded-lg shadow-md"
            />
          </div>
        </div>
      )

    case "button":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="button-text">Button Text</Label>
            <Input id="button-text" value={props.text} onChange={(e) => onUpdate({ text: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-variant">Variant</Label>
            <Select value={props.variant} onValueChange={(value) => onUpdate({ variant: value })}>
              <SelectTrigger id="button-variant">
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="destructive">Destructive</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-size">Size</Label>
            <Select value={props.size} onValueChange={(value) => onUpdate({ size: value })}>
              <SelectTrigger id="button-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-class">CSS Class</Label>
            <Input
              id="button-class"
              value={props.className}
              onChange={(e) => onUpdate({ className: e.target.value })}
            />
          </div>
        </div>
      )

    // Add more component property editors as needed

    default:
      return (
        <div className="text-center p-4 text-muted-foreground">
          Properties editor not available for this component type.
        </div>
      )
  }
}

// Missing Wand2 icon
function Wand2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 4-8 8" />
      <path d="m9 4 1 1" />
      <path d="m4 9 1 1" />
      <path d="m14 20 6-6" />
      <path d="m14 14 6 6" />
      <path d="m10 14 4 4" />
      <path d="m16 8 4 4" />
      <path d="m4 20 16-16" />
    </svg>
  )
}

// Helper function for class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
