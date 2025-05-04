"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, BookOpen, FileText } from "lucide-react"
import { generateCourse } from "@/lib/learning/course-generator"

export default function CourseGeneratorPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [topic, setTopic] = useState("")
  const [level, setLevel] = useState("beginner")
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCourse, setGeneratedCourse] = useState<any>(null)

  const handleGenerateCourse = async () => {
    if (!topic) {
      toast({
        title: "Missing information",
        description: "Please enter a course topic",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const course = await generateCourse(topic, level, {
        additionalInstructions,
      })

      setGeneratedCourse(course)
      toast({
        title: "Course generated",
        description: "Your course has been successfully generated",
      })
    } catch (error) {
      console.error("Error generating course:", error)
      toast({
        title: "Error generating course",
        description: "An error occurred while generating the course",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI Course Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Settings</CardTitle>
            <CardDescription>Configure your course generation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Course Topic
              </label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter course topic"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="level" className="text-sm font-medium">
                Difficulty Level
              </label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="all-levels">All Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="additional-instructions" className="text-sm font-medium">
                Additional Instructions (Optional)
              </label>
              <Textarea
                id="additional-instructions"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Enter any additional instructions or requirements"
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateCourse} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Course...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate Course
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Course</CardTitle>
            <CardDescription>Preview your AI-generated course</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedCourse ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{generatedCourse.title}</h3>
                  <p className="text-sm text-muted-foreground">{generatedCourse.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Level:</span> {generatedCourse.level}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {generatedCourse.duration} hours
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium">Prerequisites:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {generatedCourse.prerequisites?.map((prerequisite: string, index: number) => (
                      <li key={index}>{prerequisite}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-md font-medium">Objectives:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {generatedCourse.objectives?.map((objective: string, index: number) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {isGenerating ? "Generating course..." : "Your course will appear here"}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" disabled={!generatedCourse}>
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
            <Button disabled={!generatedCourse}>View Full Course</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
