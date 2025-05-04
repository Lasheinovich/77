import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { AgentTask, AgentType, AgentResult } from "@/types/agents"
import { executeParallelTasks } from "./parallel-executor"
import { createDecisionTree } from "./decision-tree"
import { db } from "@/lib/db"

export class AgentManager {
  private userId: string
  private userPreferences: Record<string, any>

  constructor(userId: string) {
    this.userId = userId
    this.userPreferences = {}
    this.loadUserPreferences()
  }

  private async loadUserPreferences() {
    try {
      const { data } = await db.from("user_preferences").select("*").eq("user_id", this.userId).single()
      if (data) {
        this.userPreferences = data.preferences
      }
    } catch (error) {
      console.error("Error loading user preferences:", error)
    }
  }

  async createAgent(type: AgentType, config: Record<string, any> = {}) {
    // Register agent in the database
    const { data } = await db
      .from("user_agents")
      .insert({
        user_id: this.userId,
        agent_type: type,
        config: config,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    return {
      id: data?.id,
      type,
      config: {
        ...config,
        ...(this.userPreferences[type] || {}),
      },
    }
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const { agentId, prompt, options } = task

    // Get agent configuration
    const { data: agent } = await db.from("user_agents").select("*").eq("id", agentId).single()

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`)
    }

    // Execute task based on agent type
    switch (agent.agent_type) {
      case "assistant":
        return this.executeAssistantTask(prompt, agent.config, options)
      case "researcher":
        return this.executeResearcherTask(prompt, agent.config, options)
      case "coder":
        return this.executeCoderTask(prompt, agent.config, options)
      case "teacher":
        return this.executeTeacherTask(prompt, agent.config, options)
      default:
        throw new Error(`Unsupported agent type: ${agent.agent_type}`)
    }
  }

  // New method to prioritize tasks dynamically
  private prioritizeTasks(tasks: AgentTask[]): AgentTask[] {
    // Example: Sort tasks by a priority field or other criteria
    return tasks.sort((a, b) => (b.options?.priority || 0) - (a.options?.priority || 0))
  }

  // New method to collect and analyze data for decision-making
  private async collectAndAnalyzeData(): Promise<Record<string, any>> {
    try {
      // Example: Fetch data from a database or external API
      const { data } = await db.from("analytics_data").select("*")
      return data || {}
    } catch (error) {
      console.error("Error collecting data:", error)
      return {}
    }
  }

  // Updated executeParallelTasks to include task prioritization
  async executeParallelTasks(tasks: AgentTask[]): Promise<AgentResult[]> {
    const prioritizedTasks = this.prioritizeTasks(tasks)
    return executeParallelTasks(prioritizedTasks, this)
  }

  async createDecisionTree(initialPrompt: string, options: Record<string, any> = {}) {
    return createDecisionTree(initialPrompt, this, options)
  }

  private async executeAssistantTask(
    prompt: string,
    config: Record<string, any>,
    options: Record<string, any> = {},
  ): Promise<AgentResult> {
    const { text } = await generateText({
      model: openai(config.model || "gpt-4o"),
      prompt,
      system: config.systemPrompt || "You are a helpful assistant for The Ark (الفلك) platform.",
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens,
    })

    return {
      result: text,
      metadata: {
        type: "assistant",
        timestamp: new Date().toISOString(),
      },
    }
  }

  private async executeResearcherTask(
    prompt: string,
    config: Record<string, any>,
    options: Record<string, any> = {},
  ): Promise<AgentResult> {
    // Implement researcher-specific logic
    const { text } = await generateText({
      model: openai(config.model || "gpt-4o"),
      prompt,
      system:
        config.systemPrompt ||
        "You are a research assistant that provides well-researched, factual information with citations.",
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens,
    })

    return {
      result: text,
      metadata: {
        type: "researcher",
        timestamp: new Date().toISOString(),
      },
    }
  }

  private async executeCoderTask(
    prompt: string,
    config: Record<string, any>,
    options: Record<string, any> = {},
  ): Promise<AgentResult> {
    // Implement coder-specific logic
    const { text } = await generateText({
      model: openai(config.model || "gpt-4o"),
      prompt: `Generate code for: ${prompt}`,
      system:
        config.systemPrompt || "You are a coding assistant that writes clean, efficient, and well-documented code.",
      temperature: config.temperature || 0.2,
      maxTokens: config.maxTokens,
    })

    return {
      result: text,
      metadata: {
        type: "coder",
        timestamp: new Date().toISOString(),
      },
    }
  }

  private async executeTeacherTask(
    prompt: string,
    config: Record<string, any>,
    options: Record<string, any> = {},
  ): Promise<AgentResult> {
    // Implement teacher-specific logic
    const { text } = await generateText({
      model: openai(config.model || "gpt-4o"),
      prompt,
      system:
        config.systemPrompt ||
        "You are an educational assistant that explains concepts clearly and provides helpful examples.",
      temperature: config.temperature || 0.5,
      maxTokens: config.maxTokens,
    })

    return {
      result: text,
      metadata: {
        type: "teacher",
        timestamp: new Date().toISOString(),
      },
    }
  }
}
