"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy, Download, Database, Plus, Trash } from "lucide-react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export default function CrudGeneratorPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [entityName, setEntityName] = useState("")
  const [fields, setFields] = useState<Array<{ name: string; type: string }>>([{ name: "", type: "string" }])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<{
    model: string
    api: string
    component: string
    form: string
  } | null>(null)

  const addField = () => {
    setFields([...fields, { name: "", type: "string" }])
  }

  const removeField = (index: number) => {
    const newFields = [...fields]
    newFields.splice(index, 1)
    setFields(newFields)
  }

  const updateField = (index: number, key: "name" | "type", value: string) => {
    const newFields = [...fields]
    newFields[index][key] = value
    setFields(newFields)
  }

  const handleGenerateCrud = async () => {
    if (!entityName || fields.some((field) => !field.name)) {
      toast({
        title: "Missing information",
        description: "Please enter an entity name and all field names",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate CRUD operations for an entity with the following details:
        
        Entity Name: ${entityName}
        Fields: ${JSON.stringify(fields)}
        
        Create four separate sections:
        1. Model: The database model/schema for the entity
        2. API: The API routes for CRUD operations
        3. Component: A React component to display and manage the entities
        4. Form: A form component for creating and editing entities
        
        Use Next.js App Router, React Server Components, and shadcn/ui components.
        
        Format the response as follows:
        
        ---MODEL---
        [Model code here]
        
        ---API---
        [API routes code here]
        
        ---COMPONENT---
        [Component code here]
        
        ---FORM---
        [Form code here]`,
        temperature: 0.5,
      })

      // Parse the generated text
      const modelMatch = text.match(/---MODEL---([\s\S]*?)(?:---API---|$)/i)
      const apiMatch = text.match(/---API---([\s\S]*?)(?:---COMPONENT---|$)/i)
      const componentMatch = text.match(/---COMPONENT---([\s\S]*?)(?:---FORM---|$)/i)
      const formMatch = text.match(/---FORM---([\s\S]*?)(?:$)/i)

      setGeneratedCode({
        model: modelMatch ? modelMatch[1].trim() : "",
        api: apiMatch ? apiMatch[1].trim() : "",
        component: componentMatch ? componentMatch[1].trim() : "",
        form: formMatch ? formMatch[1].trim() : "",
      })

      toast({
        title: "CRUD generated",
        description: "Your CRUD operations have been successfully generated",
      })
    } catch (error) {
      console.error("Error generating CRUD:", error)
      toast({
        title: "Error generating CRUD",
        description: "An error occurred while generating the CRUD operations",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard",
    })
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI CRUD Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entity Configuration</CardTitle>
            <CardDescription>Define your entity and its fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="entity-name" className="text-sm font-medium">
                Entity Name
              </label>
              <Input
                id="entity-name"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="e.g., User, Product, Task"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Fields</label>
                <Button variant="ghost" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(index, "name", e.target.value)}
                      placeholder="Field name"
                      className="flex-1"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, "type", e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="object">Object</option>
                      <option value="array">Array</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateCrud} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating CRUD...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Generate CRUD
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated CRUD Code</CardTitle>
            <CardDescription>Copy and use the generated code</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedCode ? (
              <Tabs defaultValue="model" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="model">Model</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                  <TabsTrigger value="component">Component</TabsTrigger>
                  <TabsTrigger value="form">Form</TabsTrigger>
                </TabsList>
                <TabsContent value="model" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatedCode.model)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs font-mono h-[300px]">
                    {generatedCode.model}
                  </pre>
                </TabsContent>
                <TabsContent value="api" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatedCode.api)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs font-mono h-[300px]">
                    {generatedCode.api}
                  </pre>
                </TabsContent>
                <TabsContent value="component" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatedCode.component)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs font-mono h-[300px]">
                    {generatedCode.component}
                  </pre>
                </TabsContent>
                <TabsContent value="form" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatedCode.form)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs font-mono h-[300px]">
                    {generatedCode.form}
                  </pre>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {isGenerating ? "Generating CRUD..." : "Your CRUD code will appear here"}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              disabled={!generatedCode}
              onClick={() => {
                if (generatedCode) {
                  const fullCode = `// Model\n${generatedCode.model}\n\n// API\n${generatedCode.api}\n\n// Component\n${generatedCode.component}\n\n// Form\n${generatedCode.form}`
                  copyToClipboard(fullCode)
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All Code
            </Button>
            <Button
              disabled={!generatedCode}
              onClick={() => {
                if (generatedCode) {
                  const blob = new Blob(
                    [
                      `// Model\n${generatedCode.model}\n\n// API\n${generatedCode.api}\n\n// Component\n${generatedCode.component}\n\n// Form\n${generatedCode.form}`,
                    ],
                    { type: "text/plain" },
                  )
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `${entityName.toLowerCase()}-crud.tsx`
                  a.click()
                  URL.revokeObjectURL(url)
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Code
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
