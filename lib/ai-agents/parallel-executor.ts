import type { AgentTask, AgentResult } from "@/types/agents"
import type { AgentManager } from "./agent-manager"

export async function executeParallelTasks(tasks: AgentTask[], agentManager: AgentManager): Promise<AgentResult[]> {
  // Execute all tasks in parallel
  const results = await Promise.all(
    tasks.map(async (task) => {
      try {
        return await agentManager.executeTask(task)
      } catch (error) {
        console.error(`Error executing task for agent ${task.agentId}:`, error)
        return {
          result: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          metadata: {
            type: "error",
            timestamp: new Date().toISOString(),
          },
        }
      }
    }),
  )

  // Log the execution in the database
  try {
    // Implementation for logging parallel execution results
    console.log("Parallel execution completed:", results.length, "tasks")
  } catch (error) {
    console.error("Error logging parallel execution:", error)
  }

  return results
}
