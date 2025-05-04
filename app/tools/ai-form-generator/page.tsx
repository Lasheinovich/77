"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { FormGenerator, type FormField } from "@/components/form-generator/form-generator"
import { AIUIAssistant } from "@/components/ai-ui-assistant/ai-ui-assistant"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Wand2, Code, Eye, Save, Copy, Download } from "lucide-react"

export default function AIFormGeneratorPage() {
  const { toast } = useToast()
  const [formDescription, setFormDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedForm, setGeneratedForm] = useState<{
    title: string
    description: string
    fields: FormField[]
  } | null>(null)
  const [activeTab, setActiveTab] = useState("editor")

  const generateForm = async () => {
    if (!formDescription.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description of the form you want to generate.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // In a real implementation, this would call an API endpoint that uses AI to generate the form
      // For demo purposes, we'll simulate the AI response
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Example generated form based on the description
      let generatedFields: FormField[] = []

      if (formDescription.toLowerCase().includes("contact")) {
        generatedFields = [
          {
            id: "name",
            type: "text",
            label: "Full Name",
            placeholder: "Enter your full name",
            required: true,
          },
          {
            id: "email",
            type: "email",
            label: "Email Address",
            placeholder: "your.email@example.com",
            required: true,
            validation: {
              pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            },
          },
          {
            id: "phone",
            type: "text",
            label: "Phone Number",
            placeholder: "Enter your phone number",
            required: false,
          },
          {
            id: "message",
            type: "textarea",
            label: "Message",
            placeholder: "Enter your message here...",
            required: true,
          },
        ]
      } else if (formDescription.toLowerCase().includes("survey")) {
        generatedFields = [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "Enter your name",
            required: false,
          },
          {
            id: "age",
            type: "select",
            label: "Age Range",
            required: true,
            options: [
              { label: "Under 18", value: "under_18" },
              { label: "18-24", value: "18-24" },
              { label: "25-34", value: "25-34" },
              { label: "35-44", value: "35-44" },
              { label: "45-54", value: "45-54" },
              { label: "55+", value: "55+" },
            ],
          },
          {
            id: "satisfaction",
            type: "radio",
            label: "How satisfied are you with our service?",
            required: true,
            options: [
              { label: "Very Satisfied", value: "very_satisfied" },
              { label: "Satisfied", value: "satisfied" },
              { label: "Neutral", value: "neutral" },
              { label: "Dissatisfied", value: "dissatisfied" },
              { label: "Very Dissatisfied", value: "very_dissatisfied" },
            ],
          },
          {
            id: "feedback",
            type: "textarea",
            label: "Additional Feedback",
            placeholder: "Please share any additional feedback...",
            required: false,
          },
        ]
      } else if (
        formDescription.toLowerCase().includes("registration") ||
        formDescription.toLowerCase().includes("signup")
      ) {
        generatedFields = [
          {
            id: "username",
            type: "text",
            label: "Username",
            placeholder: "Choose a username",
            required: true,
            validation: {
              minLength: 3,
              maxLength: 20,
            },
          },
          {
            id: "email",
            type: "email",
            label: "Email Address",
            placeholder: "your.email@example.com",
            required: true,
          },
          {
            id: "password",
            type: "password",
            label: "Password",
            required: true,
            validation: {
              minLength: 8,
            },
            description: "Password must be at least 8 characters long",
          },
          {
            id: "confirmPassword",
            type: "password",
            label: "Confirm Password",
            required: true,
          },
          {
            id: "terms",
            type: "checkbox",
            label: "I agree to the Terms and Conditions",
            required: true,
          },
        ]
      } else {
        // Default form if no specific type is detected
        generatedFields = [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "Enter your name",
            required: true,
          },
          {
            id: "email",
            type: "email",
            label: "Email",
            placeholder: "your.email@example.com",
            required: true,
          },
          {
            id: "message",
            type: "textarea",
            label: "Message",
            placeholder: "Enter your message here...",
            required: false,
          },
        ]
      }

      setGeneratedForm({
        title: getFormTitle(formDescription),
        description: getFormDescription(formDescription),
        fields: generatedFields,
      })

      setActiveTab("preview")

      toast({
        title: "Form Generated",
        description: "Your form has been generated successfully!",
      })
    } catch (error) {
      console.error("Error generating form:", error)
      toast({
        title: "Error",
        description: "Failed to generate the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getFormTitle = (description: string) => {
    if (description.toLowerCase().includes("contact")) {
      return "Contact Us"
    } else if (description.toLowerCase().includes("survey")) {
      return "Customer Satisfaction Survey"
    } else if (description.toLowerCase().includes("registration") || description.toLowerCase().includes("signup")) {
      return "Account Registration"
    } else {
      return "Generated Form"
    }
  }

  const getFormDescription = (description: string) => {
    if (description.toLowerCase().includes("contact")) {
      return "Please fill out this form to get in touch with our team."
    } else if (description.toLowerCase().includes("survey")) {
      return "We value your feedback! Please take a moment to complete this survey."
    } else if (description.toLowerCase().includes("registration") || description.toLowerCase().includes("signup")) {
      return "Create your account to get started."
    } else {
      return "Please fill out the form below."
    }
  }

  const copyFormCode = () => {
    if (!generatedForm) return

    const formCode = `
import { FormGenerator } from "@/components/form-generator/form-generator"

export default function MyForm() {
  return (
    <FormGenerator
      id="my-form"
      title="${generatedForm.title}"
      description="${generatedForm.description}"
      fields={${JSON.stringify(generatedForm.fields, null, 2)}}
      onSubmit={(data) => {
        console.log("Form data:", data)
        // Handle form submission
      }}
    />
  )
}
`

    navigator.clipboard.writeText(formCode)

    toast({
      title: "Code Copied",
      description: "The form code has been copied to your clipboard.",
    })
  }

  const downloadFormJSON = () => {
    if (!generatedForm) return

    const formJSON = JSON.stringify(generatedForm, null, 2)
    const blob = new Blob([formJSON], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "generated-form.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Form Downloaded",
      description: "The form JSON has been downloaded.",
    })
  }

  const handleFormSubmit = (data: any) => {
    console.log("Form submitted with data:", data)

    toast({
      title: "Form Submitted",
      description: "Form data has been submitted successfully.",
    })
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">AI Form Generator</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Describe the form you need, and our AI will generate it for you.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Your Form</CardTitle>
            <CardDescription>
              Describe the type of form you need (e.g., contact form, survey, registration form)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-description">Form Description</Label>
                <Textarea
                  id="form-description"
                  placeholder="E.g., I need a contact form with name, email, and message fields..."
                  rows={5}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={generateForm} disabled={isGenerating || !formDescription.trim()}>
                  {isGenerating ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Form
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {generatedForm && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Form</CardTitle>
              <CardDescription>Preview and customize your generated form</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <Code className="mr-2 h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="json">
                    <Save className="mr-2 h-4 w-4" />
                    JSON
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="p-0">
                  <FormGenerator
                    id="preview-form"
                    title={generatedForm.title}
                    description={generatedForm.description}
                    fields={generatedForm.fields}
                    onSubmit={handleFormSubmit}
                  />
                </TabsContent>

                <TabsContent value="code">
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-muted overflow-auto text-sm">
                      <code>{`import { FormGenerator } from "@/components/form-generator/form-generator"

export default function MyForm() {
  return (
    <FormGenerator
      id="my-form"
      title="${generatedForm.title}"
      description="${generatedForm.description}"
      fields={${JSON.stringify(generatedForm.fields, null, 2)}}
      onSubmit={(data) => {
        console.log("Form data:", data)
        // Handle form submission
      }}
    />
  )
}`}</code>
                    </pre>
                    <Button variant="outline" size="icon" className="absolute top-2 right-2" onClick={copyFormCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="json">
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-muted overflow-auto text-sm">
                      <code>{JSON.stringify(generatedForm, null, 2)}</code>
                    </pre>
                    <Button variant="outline" size="icon" className="absolute top-2 right-2" onClick={downloadFormJSON}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("preview")}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" onClick={copyFormCode}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </Button>
              <Button variant="outline" onClick={downloadFormJSON}>
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>1. Describe Your Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Tell our AI what kind of form you need. Be as specific as possible about the fields and purpose.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. AI Generates Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Our AI analyzes your description and generates a complete form with appropriate fields and validation.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Use Your Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Preview the form, copy the code, or download the JSON to use in your project.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIUIAssistant pageContext="ai-form-generator" userRole="user" />
    </div>
  )
}
