import { generateText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { db } from "@/lib/db"

const lessonSchema = z.object({
  title: z.string(),
  content: z.string(),
  duration: z.number(),
  objectives: z.array(z.string()),
  resources: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      type: z.enum(["article", "video", "exercise", "quiz"]),
    }),
  ),
})

const quizSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      explanation: z.string(),
    }),
  ),
})

const courseSchema = z.object({
  title: z.string(),
  description: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]),
  duration: z.number(),
  prerequisites: z.array(z.string()),
  objectives: z.array(z.string()),
  modules: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      lessons: z.array(lessonSchema),
      quiz: quizSchema,
    }),
  ),
})

export async function generateCourse(topic: string, level: string, options: Record<string, any> = {}) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: courseSchema,
      prompt: `Generate a comprehensive course on "${topic}" for ${level} level students. 
      The course should include modules, each with lessons and a quiz. 
      Each lesson should have clear objectives, content, and resources.
      ${options.additionalInstructions || ""}`,
      temperature: 0.5,
    })

    // Store the generated course in the database
    const { data: course } = await db
      .from("courses")
      .insert({
        title: object.title,
        description: object.description,
        level: object.level,
        duration: object.duration,
        prerequisites: object.prerequisites,
        objectives: object.objectives,
        created_at: new Date().toISOString(),
        generated: true,
        status: "draft",
      })
      .select()
      .single()

    if (course) {
      // Store modules
      for (const [moduleIndex, moduleData] of object.modules.entries()) {
        const { data: moduleRecord } = await db
          .from("modules")
          .insert({
            course_id: course.id,
            title: moduleData.title,
            description: moduleData.description,
            order: moduleIndex,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (moduleRecord) {
          // Store lessons
          for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
            await db.from("lessons").insert({
              module_id: moduleRecord.id,
              title: lessonData.title,
              content: lessonData.content,
              duration: lessonData.duration,
              objectives: lessonData.objectives,
              resources: lessonData.resources,
              order: lessonIndex,
              created_at: new Date().toISOString(),
            })
          }

          // Store quiz
          await db.from("quizzes").insert({
            module_id: moduleRecord.id,
            title: moduleData.quiz.title,
            description: moduleData.quiz.description,
            questions: moduleData.quiz.questions,
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    return course
  } catch (error) {
    console.error("Error generating course:", error)
    throw error
  }
}

export async function generateLearningPath(topic: string, options: Record<string, any> = {}) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate a learning path for "${topic}". 
      The learning path should include a sequence of courses, projects, and assessments.
      Each item should build upon the previous ones, creating a comprehensive learning journey.
      ${options.additionalInstructions || ""}`,
      temperature: 0.5,
    })

    // Parse the generated learning path
    // This is a simplified implementation
    const learningPath = {
      title: `${topic} Learning Path`,
      description: text.split("\n\n")[0] || "",
      items: text
        .split("\n\n")
        .slice(1)
        .map((item, index) => {
          const lines = item.split("\n")
          const title = lines[0].replace(/^\d+\.\s*/, "")
          const description = lines.slice(1).join("\n")
          return {
            id: `item-${index}`,
            title,
            description,
            order: index,
            type: title.toLowerCase().includes("project")
              ? "project"
              : title.toLowerCase().includes("assessment")
                ? "assessment"
                : "course",
          }
        }),
    }

    // Store the generated learning path in the database
    const { data: learningPathRecord } = await db
      .from("learning_paths")
      .insert({
        title: learningPath.title,
        description: learningPath.description,
        created_at: new Date().toISOString(),
        status: "draft",
      })
      .select()
      .single()

    if (learningPathRecord) {
      // Store learning path items
      for (const [index, item] of learningPath.items.entries()) {
        await db.from("learning_path_items").insert({
          learning_path_id: learningPathRecord.id,
          title: item.title,
          description: item.description,
          type: item.type,
          order: index,
          created_at: new Date().toISOString(),
        })
      }
    }

    return learningPathRecord
  } catch (error) {
    console.error("Error generating learning path:", error)
    throw error
  }
}

export async function generateQuiz(topic: string, difficulty = "medium", questionCount = 10) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        title: z.string(),
        description: z.string(),
        questions: z
          .array(
            z.object({
              question: z.string(),
              options: z.array(z.string()),
              correctAnswer: z.number(),
              explanation: z.string(),
            }),
          )
          .length(questionCount),
      }),
      prompt: `Generate a ${difficulty} difficulty quiz on "${topic}" with ${questionCount} questions. 
      Each question should have 4 options with one correct answer.
      Include explanations for the correct answers.`,
      temperature: 0.5,
    })

    return object
  } catch (error) {
    console.error("Error generating quiz:", error)
    throw error
  }
}

export async function generateCertificate(userId: string, courseId: string) {
  try {
    // Get user and course information
    const { data: user } = await db.from("users").select("*").eq("id", userId).single()
    const { data: course } = await db.from("courses").select("*").eq("id", courseId).single()

    if (!user || !course) {
      throw new Error("User or course not found")
    }

    // Generate certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Store certificate in database
    const { data: certificate } = await db
      .from("certificates")
      .insert({
        user_id: userId,
        course_id: courseId,
        certificate_id: certificateId,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        status: "active",
      })
      .select()
      .single()

    return certificate
  } catch (error) {
    console.error("Error generating certificate:", error)
    throw error
  }
}

export async function generateFeedback(userId: string, submissionId: string, submissionContent: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Provide detailed, constructive feedback for the following submission:
      
      ${submissionContent}
      
      Focus on strengths, areas for improvement, and specific suggestions for enhancement.
      Be encouraging but honest, and provide actionable advice.`,
      temperature: 0.7,
    })

    // Store feedback in database
    const { data: feedback } = await db
      .from("feedback")
      .insert({
        user_id: userId,
        submission_id: submissionId,
        content: text,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    return feedback
  } catch (error) {
    console.error("Error generating feedback:", error)
    throw error
  }
}
