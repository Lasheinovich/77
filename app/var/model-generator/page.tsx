"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Download, CuboidIcon as Cube } from "lucide-react"
import { ModelViewer } from "@/components/var/3d-model-viewer"

export default function ModelGeneratorPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [modelType, setModelType] = useState("object")
  const [style, setStyle] = useState("realistic")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedModel, setGeneratedModel] = useState<string | null>(null)

  const handleGenerateModel = async () => {
    if (!prompt) {
      toast({
        title: "Missing information",
        description: "Please enter a description for your 3D model",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // This is a mock implementation
      // In a real application, you would call an API to generate the 3D model
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // For demo purposes, we'll use a sample model
      setGeneratedModel("/assets/3d/duck.glb")

      toast({
        title: "Model generated",
        description: "Your 3D model has been successfully generated",
      })
    } catch (error) {
      console.error("Error generating model:", error)
      toast({
        title: "Error generating model",
        description: "An error occurred while generating the model",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI 3D Model Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Settings</CardTitle>
            <CardDescription>Configure your 3D model generation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Model Description
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the 3D model you want to generate"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="model-type" className="text-sm font-medium">
                Model Type
              </label>
              <Select value={modelType} onValueChange={setModelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="object">Object</SelectItem>
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="style" className="text-sm font-medium">
                Style
              </label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="stylized">Stylized</SelectItem>
                  <SelectItem value="low-poly">Low Poly</SelectItem>
                  <SelectItem value="cartoon">Cartoon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateModel} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Model...
                </>
              ) : (
                <>
                  <Cube className="mr-2 h-4 w-4" />
                  Generate Model
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Model</CardTitle>
            <CardDescription>Preview your AI-generated 3D model</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedModel ? (
              <ModelViewer
                modelUrl={generatedModel}
                title="Generated 3D Model"
                description={prompt}
                controls={{
                  enableZoom: true,
                  enableRotate: true,
                  enablePan: true,
                  autoRotate: true,
                }}
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {isGenerating ? "Generating model..." : "Your 3D model will appear here"}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" disabled={!generatedModel}>
              <Download className="mr-2 h-4 w-4" />
              Download Model
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
