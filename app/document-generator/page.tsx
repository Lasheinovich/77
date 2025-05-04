"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { FileText, Download, Loader2 } from "lucide-react"

export default function DocumentGeneratorPage() {
  const { t } = useTranslation()
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [documentType, setDocumentType] = useState("report")
  const [generatedDocument, setGeneratedDocument] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const generateDocument = async () => {
    if (!title || !topic) return

    setIsGenerating(true)
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate a ${documentType} titled "${title}" about "${topic}". Include proper formatting, sections, and professional language.`,
      })
      setGeneratedDocument(text)
    } catch (error) {
      console.error("Error generating document:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadDocument = () => {
    if (!generatedDocument) return

    const blob = new Blob([generatedDocument], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI Document Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Settings</CardTitle>
            <CardDescription>Configure your document generation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the document topic or description"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="research-paper">Research Paper</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="business-plan">Business Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateDocument} disabled={isGenerating || !title || !topic} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Document</CardTitle>
            <CardDescription>Preview your AI-generated document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px] w-full rounded-md border border-input bg-background p-4 font-serif text-sm overflow-auto">
              {generatedDocument ? (
                <div className="whitespace-pre-wrap">{generatedDocument}</div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {isGenerating ? "Generating document..." : "Your document will appear here"}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={downloadDocument} disabled={!generatedDocument} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Document
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
