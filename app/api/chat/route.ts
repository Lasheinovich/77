import { openai } from "@ai-sdk/openai"
import { streamText, convertToCoreMessages } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: openai("gpt-4o"),
      messages: convertToCoreMessages(messages),
      system:
        "You are an AI assistant for The Ark (الفلك), a universal AI web system for learning, business, marketplace, community, AI SaaS, life assistant, coding playground, and DAR Al-Hikmah AI School. You are helpful, knowledgeable, and can assist with a wide range of topics.",
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "An error occurred during your request." }, { status: 500 })
  }
}
