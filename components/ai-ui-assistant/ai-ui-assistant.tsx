"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Wand2, MessageSquare, Lightbulb, X, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface AIUIAssistantProps {
  onSuggestionApply?: (suggestion: string) => void
  pageContext?: string
  userRole?: string
}

export function AIUIAssistant({ onSuggestionApply, pageContext = "general", userRole = "user" }: AIUIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [conversation, setConversation] = useLocalStorage<{ role: "user" | "assistant"; content: string }[]>(
    `ai-assistant-conversation-${pageContext}`,
    [],
  )
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation, isMinimized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Add user message to conversation
    setConversation([...conversation, { role: "user", content: query }])

    // Clear input
    setQuery("")
    setIsLoading(true)

    try {
      // Call AI API
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...conversation, { role: "user", content: query }],
          pageContext,
          userRole,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from AI assistant")
      }

      const data = await response.json()

      // Add assistant response to conversation
      setConversation([
        ...conversation,
        { role: "user", content: query },
        { role: "assistant", content: data.response },
      ])

      // Update suggestions if provided
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
        setActiveTab("suggestions")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      })

      // Add error message to conversation
      setConversation([
        ...conversation,
        { role: "user", content: query },
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionApply) {
      onSuggestionApply(suggestion)
      toast({
        title: "Suggestion Applied",
        description: "The UI suggestion has been applied successfully.",
      })
    }
  }

  const clearConversation = () => {
    setConversation([])
    setSuggestions([])
    toast({
      title: "Conversation Cleared",
      description: "Your conversation history has been cleared.",
    })
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 p-0 shadow-lg"
        aria-label="Open AI UI Assistant"
      >
        <Wand2 className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-[425px] transition-all duration-300",
            isMinimized ? "h-16 overflow-hidden" : "sm:max-h-[85vh]",
          )}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <Wand2 className="h-5 w-5 mr-2" />
              AI UI Assistant
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
                aria-label={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <DialogDescription>Ask for UI suggestions or help with the current page.</DialogDescription>

              <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="suggestions">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Suggestions
                    {suggestions.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {suggestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="space-y-4">
                  <div className="h-[300px] overflow-y-auto border rounded-md p-4 space-y-4">
                    {conversation.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Wand2 className="h-8 w-8 mx-auto mb-2" />
                        <p>Ask me anything about the UI or for suggestions!</p>
                      </div>
                    ) : (
                      conversation.map((message, index) => (
                        <div
                          key={index}
                          className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-2",
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask for UI suggestions..."
                      disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !query.trim()}>
                      Send
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                  <div className="h-[300px] overflow-y-auto border rounded-md p-4">
                    {suggestions.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                        <p>No suggestions yet. Chat with the assistant to get some!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <p>{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={clearConversation} disabled={conversation.length === 0}>
                  Clear History
                </Button>
                <p className="text-xs text-muted-foreground">Context: {pageContext}</p>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
