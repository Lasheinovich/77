"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { PlayIcon, DownloadIcon, RefreshCwIcon } from "lucide-react"

export default function CodingPlayground() {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [output, setOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const generateCode = async (prompt: string) => {
    setIsGenerating(true)
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate ${language} code for: ${prompt}. Only return the code, no explanations.`,
      })
      setCode(text)
    } catch (error) {
      console.error("Error generating code:", error)
      setOutput("Error generating code. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput("Running code...")

    try {
      // This is a simplified implementation
      // In a real app, you would use a secure sandbox environment
      if (language === "javascript") {
        // For demo purposes only - in production use a secure evaluation method
        const result = (await new Promise((resolve) => {
          const originalConsoleLog = console.log
          const logs: string[] = []

          // Override console.log to capture output
          console.log = (...args) => {
            logs.push(args.map((arg) => String(arg)).join(" "))
          }

          try {
            // Execute the code in a try-catch block
            const result = new Function(code)()
            resolve({ result, logs })
          } catch (error) {
            resolve({ error: String(error), logs })
          } finally {
            // Restore original console.log
            console.log = originalConsoleLog
          }
        })) as any

        setOutput(
          [
            ...result.logs,
            result.error ? `Error: ${result.error}` : "",
            result.result !== undefined ? `Result: ${result.result}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
      } else {
        setOutput(`Running ${language} code is not supported in this demo.`)
      }
    } catch (error) {
      console.error("Error running code:", error)
      setOutput(`Error: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI Coding Playground</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Code Editor</CardTitle>
            <CardDescription>Write or generate code and run it instantly</CardDescription>
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="generate">Generate</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="space-y-4">
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="absolute right-2 top-2 z-10 rounded border bg-background px-2 py-1 text-xs"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="min-h-[300px] w-full rounded-md border border-input bg-background p-4 font-mono text-sm"
                    placeholder="Write your code here..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="generate" className="space-y-4">
                <div className="space-y-4">
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-input bg-background p-4 text-sm"
                    placeholder="Describe what code you want to generate..."
                    id="prompt"
                  />
                  <Button
                    onClick={() => {
                      const prompt = (document.getElementById("prompt") as HTMLTextAreaElement).value
                      generateCode(prompt)
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Generate Code"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <Button onClick={runCode} disabled={isRunning || !code}>
              <PlayIcon className="mr-2 h-4 w-4" />
              Run
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setCode("")}>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const blob = new Blob([code], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `code.${language}`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>See the results of your code execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] w-full rounded-md border border-input bg-black p-4 font-mono text-sm text-white">
              {output || "Run your code to see output here..."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
