"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function AdminApiKeyRotation() {
  const [newApiKey, setNewApiKey] = useState("")
  const { toast } = useToast()

  const handleGenerateApiKey = () => {
    // Generate a new API key (replace with a secure key generation method)
    const generatedKey = generateSecureApiKey()
    setNewApiKey(generatedKey)
  }

  const handleSaveApiKey = async () => {
    // Save the new API key to the database and environment variables
    try {
      // Call your API endpoint to update the API key
      const response = await fetch("/api/admin/update-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newApiKey }),
      })

      if (response.ok) {
        toast({
          title: "API Key Updated",
          description: "The ADMIN_API_KEY has been successfully updated.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update the API key. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the API key.",
        variant: "destructive",
      })
    }
  }

  // Function to generate a secure API key
  const generateSecureApiKey = () => {
    const apiKey = crypto.randomUUID()
    return apiKey
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rotate Admin API Key</CardTitle>
        <CardDescription>Generate and update the ADMIN_API_KEY for enhanced security.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="new-api-key">New API Key</Label>
          <Input id="new-api-key" value={newApiKey} readOnly placeholder="Generate a new API key" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateApiKey}>
            Generate API Key
          </Button>
          <Button onClick={handleSaveApiKey} disabled={!newApiKey}>
            Save API Key
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
