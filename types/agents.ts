export type AgentType = "assistant" | "researcher" | "coder" | "teacher" | "custom"

export interface AgentTask {
  agentId: string
  prompt: string
  options?: Record<string, unknown>
}

export interface AgentResult {
  result: string | Record<string, unknown>
  metadata: {
    type: string
    timestamp: string
    [key: string]: string | number | boolean | null | undefined
  }
}

export interface DecisionNode {
  id: string
  type: "task" | "decision" | "api" | "transform"
  action: "generate-text" | "execute-agent" | "api-call" | "transform-data"
  config?: Record<string, unknown>
  next?: string
  paths?: Record<string, string>
}

export interface DecisionTree {
  id: string
  prompt: string
  rootNode: string
  nodes: Record<string, DecisionNode>
  createdAt: string
  metadata: Record<string, unknown>
  execute: (input: string, context?: Record<string, unknown>) => Promise<unknown>
}
