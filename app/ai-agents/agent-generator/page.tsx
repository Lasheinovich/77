"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { AgentManager } from "@/lib/ai-agents/agent-manager"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Play, Plus } from "lucide-react"

export default function AgentGeneratorPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [agentName, setAgentName] = useState("")
  const [agentDescription, setAgentDescription] = useState("")
  const [agentType, setAgentType] = useState<string>("assistant")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedAgent, setGeneratedAgent] = useState<Record<string, any> | null>(null)

  const generateAgent = async () => {
    if (!agentName || !agentDescription || !agentType) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate an AI agent with the following details:
        Name: ${agentName}
        Description: ${agentDescription}
        Type: ${agentType}
        
        Create a detailed system prompt and configuration for this agent. Format the response as a JSON object with the following structure:
        {
          "name": "Agent name",
          "description": "Agent description",
          "type": "Agent type",
          "systemPrompt": "Detailed system prompt",
          "config": {
            "temperature": 0.7,
            "model": "gpt-4o",
            "maxTokens": 2000,
            "additionalInstructions": []
          }
        }`,
        temperature: 0.5,
      })

      try {
        const agentConfig = JSON.parse(text)
        setGeneratedAgent(agentConfig)
        setSystemPrompt(agentConfig.systemPrompt || "")
      } catch (error) {
        console.error("Error parsing agent configuration:", error)
        toast({
          title: "Error generating agent",
          description: "Failed to parse the generated configuration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating agent:", error)
      toast({
        title: "Error generating agent",
        description: "An error occurred while generating the agent",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveAgent = async () => {
    if (!user || !generatedAgent) return

    setIsSaving(true)
    try {
      const agentManager = new AgentManager(user.id)
      const agent = await agentManager.createAgent(agentType as any, {
        name: agentName,
        description: agentDescription,
        systemPrompt: systemPrompt,
        ...(generatedAgent.config || {}),
      })

      toast({
        title: "Agent created",
        description: `${agentName} has been created successfully`,
      })

      // Reset form
      setAgentName("")
      setAgentDescription("")
      setSystemPrompt("")
      setGeneratedAgent(null)
    } catch (error) {
      console.error("Error saving agent:", error)
      toast({
        title: "Error saving agent",
        description: "An error occurred while saving the agent",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI Agent Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Define your AI agent's capabilities and behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="agent-name" className="text-sm font-medium">
                Agent Name
              </label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter agent name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="agent-description" className="text-sm font-medium">
                Agent Description
              </label>
              <Textarea
                id="agent-description"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="Describe what this agent does"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="agent-type" className="text-sm font-medium">
                Agent Type
              </label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assistant">General Assistant</SelectItem>
                  <SelectItem value="researcher">Researcher</SelectItem>
                  <SelectItem value="coder">Code Generator</SelectItem>
                  <SelectItem value="teacher">Educational Assistant</SelectItem>
                  <SelectItem value="custom">Custom Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateAgent} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Agent
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Agent</CardTitle>
            <CardDescription>Review and customize your AI agent</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="system-prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="system-prompt">System Prompt</TabsTrigger>
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
              </TabsList>
              <TabsContent value="system-prompt" className="space-y-4">
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="System prompt will appear here after generation"
                  rows={10}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="configuration" className="space-y-4">
                <div className="min-h-[300px] w-full rounded-md border border-input bg-background p-4 font-mono text-sm overflow-auto">
                  {generatedAgent ? (
                    <pre>{JSON.stringify(generatedAgent.config || {}, null, 2)}</pre>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      Configuration will appear here after generation
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" disabled={!generatedAgent}>
              <Play className="mr-2 h-4 w-4" />
              Test Agent
            </Button>
            <Button onClick={saveAgent} disabled={isSaving || !generatedAgent}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Agent
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
