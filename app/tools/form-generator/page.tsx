"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy, Download, FormInput } from "lucide-react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export default function FormGeneratorPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedForm, setGeneratedForm] = useState<{
    jsx: string
    schema: string
    validation: string
  } | null>(null)

  const handleGenerateForm = async () => {
    if (!prompt) {
      toast({
        title: "Missing information",
        description: "Please enter a description for your form",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate a React form based on the following description: "${prompt}".
        
        Create three separate sections:
        1. JSX: The React JSX code for the form using shadcn/ui components
        2. Schema: A Zod schema for form validation
        3. Validation: React Hook Form setup with the Zod schema
        
        Format the response as follows:
        
        ---JSX---
        [JSX code here]
        
        ---SCHEMA---
        [Zod schema code here]
        
        ---VALIDATION---
        [React Hook Form validation code here]`,
        temperature: 0.5,
      })

      // Parse the generated text
      const jsxMatch = text.match(/---JSX---([\s\S]*?)(?:---SCHEMA---|$)/i)
      const schemaMatch = text.match(/---SCHEMA---([\s\S]*?)(?:---VALIDATION---|$)/i)
      const validationMatch = text.match(/---VALIDATION---([\s\S]*?)(?:$)/i)

      setGeneratedForm({
        jsx: jsxMatch ? jsxMatch[1].trim() : "",
        schema: schemaMatch ? schemaMatch[1].trim() : "",
        validation: validationMatch ? validationMatch[1].trim() : "",
      })

      toast({
        title: "Form generated",
        description: "Your form has been successfully generated",
      })
    } catch (error) {
      console.error("Error generating form:", error)
      toast({
        title: "Error generating form",
        description: "An error occurred while generating the form",
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
      <h1 className="text-3xl font-bold mb-6">AI Form Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Description</CardTitle>
            <CardDescription>Describe the form you want to generate</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the form you want to generate (e.g., 'A contact form with name, email, subject, and message fields')"
              rows={8}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateForm} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Form...
                </>
              ) : (
                <>
                  <FormInput className="mr-2 h-4 w-4" />
                  Generate Form
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Form Code</CardTitle>
            <CardDescription>Copy and use the generated form code</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedForm ? (
              <Tabs defaultValue="jsx" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="jsx">JSX</TabsTrigger>
                  <TabsTrigger value="schema">Schema</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                </TabsList>
                <TabsContent value="jsx" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatedForm.jsx)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs font-mono h-[300px]">
                    {generatedForm.jsx}
                  </pre>
                </TabsContent>
                <TabsContent value="schema" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatedForm.schema)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs font-mono h-[300px]">
                    {generatedForm.schema}
                  </pre>
                </TabsContent>
                <TabsContent value="validation" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generatedForm.validation)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs font-mono h-[300px]">
                    {generatedForm.validation}
                  </pre>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {isGenerating ? "Generating form..." : "Your form code will appear here"}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              disabled={!generatedForm}
              onClick={() => {
                if (generatedForm) {
                  const fullCode = `// JSX\n${generatedForm.jsx}\n\n// Schema\n${generatedForm.schema}\n\n// Validation\n${generatedForm.validation}`
                  copyToClipboard(fullCode)
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All Code
            </Button>
            <Button
              disabled={!generatedForm}
              onClick={() => {
                if (generatedForm) {
                  const blob = new Blob(
                    [
                      `// JSX\n${generatedForm.jsx}\n\n// Schema\n${generatedForm.schema}\n\n// Validation\n${generatedForm.validation}`,
                    ],
                    { type: "text/plain" },
                  )
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "generated-form.tsx"
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
