import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { AgentManager } from "./agent-manager"
import type { DecisionNode, DecisionTree } from "@/types/agents"

export async function createDecisionTree(
  initialPrompt: string,
  agentManager: AgentManager,
  options: Record<string, any> = {},
): Promise<DecisionTree> {
  // Generate the initial decision tree structure
  const { text } = await generateText({
    model: openai(options.model || "gpt-4o"),
    prompt: `Create a decision tree for handling the following task: "${initialPrompt}". 
    Break this down into logical steps, decision points, and potential paths.
    Format the response as a JSON object with nodes, edges, and decision points.`,
    system:
      "You are a decision tree generator for AI agents. Create detailed, logical decision trees that break complex tasks into manageable steps.",
    temperature: 0.2,
  })

  let treeStructure: any
  try {
    treeStructure = JSON.parse(text)
  } catch (error) {
    console.error("Error parsing decision tree:", error)
    throw new Error("Failed to generate valid decision tree structure")
  }

  // Create the decision tree object
  const tree: DecisionTree = {
    id: `tree-${Date.now()}`,
    prompt: initialPrompt,
    rootNode: treeStructure.rootNode,
    nodes: treeStructure.nodes,
    createdAt: new Date().toISOString(),
    metadata: {
      ...options,
      generatedBy: "ai-decision-tree-generator",
    },
    execute: async (input: string, context: Record<string, any> = {}) => {
      return executeDecisionTree(tree, input, context, agentManager)
    },
  }

  return tree
}

async function executeDecisionTree(
  tree: DecisionTree,
  input: string,
  context: Record<string, any>,
  agentManager: AgentManager,
): Promise<any> {
  let currentNodeId = tree.rootNode
  const results: Record<string, any> = {}
  const path: string[] = [currentNodeId]

  while (currentNodeId) {
    const currentNode = tree.nodes[currentNodeId]

    if (!currentNode) {
      throw new Error(`Node ${currentNodeId} not found in decision tree`)
    }

    // Execute the current node
    const nodeResult = await executeNode(currentNode, input, context, agentManager)
    results[currentNodeId] = nodeResult

    // Update context with the result
    context[currentNodeId] = nodeResult

    // Determine the next node
    if (currentNode.type === "decision") {
      // For decision nodes, use the AI to determine which path to take
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Based on the following context and result, which path should be taken next?
        Context: ${JSON.stringify(context)}
        Current Node Result: ${JSON.stringify(nodeResult)}
        Available Paths: ${JSON.stringify(currentNode.paths)}
        
        Return only the ID of the next node to execute.`,
        temperature: 0.2,
      })

      currentNodeId = text.trim()
    } else if (currentNode.next) {
      // For regular nodes, follow the defined next node
      currentNodeId = currentNode.next
    } else {
      // End of path
      currentNodeId = ""
    }

    if (currentNodeId) {
      path.push(currentNodeId)
    }
  }

  return {
    results,
    path,
    finalResult: path.length > 0 ? results[path[path.length - 1]] : null,
  }
}

async function executeNode(
  node: DecisionNode,
  input: string,
  context: Record<string, any>,
  agentManager: AgentManager,
): Promise<any> {
  switch (node.action) {
    case "generate-text":
      return executeGenerateTextNode(node, input, context)
    case "execute-agent":
      return executeAgentNode(node, input, context, agentManager)
    case "api-call":
      return executeApiCallNode(node, input, context)
    case "transform-data":
      return executeTransformDataNode(node, input, context)
    default:
      throw new Error(`Unsupported node action: ${node.action}`)
  }
}

async function executeGenerateTextNode(
  node: DecisionNode,
  input: string,
  context: Record<string, any>,
): Promise<string> {
  const { text } = await generateText({
    model: openai(node.config?.model || "gpt-4o"),
    prompt: replaceVariables(node.config?.prompt || input, context),
    system: node.config?.system || "You are an AI assistant helping with a task.",
    temperature: node.config?.temperature || 0.7,
  })

  return text
}

async function executeAgentNode(
  node: DecisionNode,
  input: string,
  context: Record<string, any>,
  agentManager: AgentManager,
): Promise<any> {
  const agentId = node.config?.agentId
  if (!agentId) {
    throw new Error("Agent ID is required for execute-agent action")
  }

  const result = await agentManager.executeTask({
    agentId,
    prompt: replaceVariables(node.config?.prompt || input, context),
    options: node.config?.options || {},
  })

  return result
}

async function executeApiCallNode(node: DecisionNode, input: string, context: Record<string, any>): Promise<any> {
  const url = replaceVariables(node.config?.url || "", context)
  const method = node.config?.method || "GET"
  const headers = node.config?.headers || {}
  const body = node.config?.body ? JSON.stringify(replaceVariables(node.config.body, context)) : undefined

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API call error:", error)
    throw error
  }
}

async function executeTransformDataNode(node: DecisionNode, input: string, context: Record<string, any>): Promise<any> {
  const transformType = node.config?.transformType
  const data = node.config?.data ? replaceVariables(node.config.data, context) : input

  switch (transformType) {
    case "parse-json":
      return JSON.parse(data)
    case "stringify-json":
      return JSON.stringify(data)
    case "extract-key":
      const key = node.config?.key
      if (!key) {
        throw new Error("Key is required for extract-key transform")
      }
      return data[key]
    default:
      throw new Error(`Unsupported transform type: ${transformType}`)
  }
}

function replaceVariables(template: string | Record<string, any>, context: Record<string, any>): any {
  if (typeof template === "string") {
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const trimmedKey = key.trim()
      return context[trimmedKey] !== undefined ? context[trimmedKey] : match
    })
  } else if (typeof template === "object" && template !== null) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(template)) {
      result[key] = replaceVariables(value, context)
    }
    return result
  }
  return template
}
