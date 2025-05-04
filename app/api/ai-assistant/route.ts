import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, pageContext, userRole } = await req.json();

    // System prompt based on context
    // cSpell:disable-next-line
    const systemPrompt = `You are an AI UI Assistant for The Ark (الفلك), a comprehensive AI-powered platform. 
    Your role is to help users with UI/UX suggestions and improvements.
    
    Current context: ${pageContext}
    User role: ${userRole}
    
    Provide helpful, concise responses. When appropriate, offer specific UI suggestions that could be applied.
    Format your suggestions in a way that they can be easily parsed and applied to the UI.`;

    // Generate response using AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: formatMessages(messages),
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Extract suggestions from the response
    const suggestions = extractSuggestions(text);

    return NextResponse.json({
      response: text,
      suggestions,
    });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// Format messages for the AI model
function formatMessages(messages: { role: string; content: string }[]) {
  return messages.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n\n");
}

// Extract suggestions from the response
function extractSuggestions(text: string) {
  const suggestions: string[] = [];

  // Look for suggestion patterns
  const suggestionRegex = /Suggestion:([^\n]+)/g;
  let match: RegExpExecArray | null;

  // Fix: Add type annotation and proper null check
  while ((match = suggestionRegex.exec(text)) !== null) {
    if (match[1]) { // Add null check for the capturing group
      suggestions.push(match[1].trim());
    }
  }

  return suggestions;
}
