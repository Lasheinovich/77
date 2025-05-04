import { db } from "@/lib/db"

export interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  enabled: boolean
  entryPoint: string
  dependencies: string[]
  hooks: Record<string, string[]>
  settings: Record<string, any>
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private hooks: Map<string, Set<string>> = new Map()
  private loadedPlugins: Set<string> = new Set()

  constructor() {
    this.loadPlugins()
  }

  private async loadPlugins() {
    try {
      // Load plugins from database
      const { data: pluginsData } = await db.from("plugins").select("*").eq("enabled", true)

      if (pluginsData) {
        for (const pluginData of pluginsData) {
          await this.registerPlugin(pluginData)
        }
      }
    } catch (error) {
      console.error("Error loading plugins:", error)
    }
  }

  async registerPlugin(plugin: Plugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered`)
      return false
    }

    // Check dependencies
    for (const dependency of plugin.dependencies) {
      if (!this.plugins.has(dependency)) {
        console.warn(`Plugin ${plugin.id} depends on ${dependency}, which is not registered`)
        return false
      }
    }

    // Register plugin
    this.plugins.set(plugin.id, plugin)

    // Register hooks
    for (const [hookName, callbacks] of Object.entries(plugin.hooks)) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, new Set())
      }

      for (const callback of callbacks) {
        this.hooks.get(hookName)?.add(`${plugin.id}:${callback}`)
      }
    }

    // Load plugin
    try {
      // In a real implementation, you would dynamically import the plugin
      // For now, we'll just mark it as loaded
      this.loadedPlugins.add(plugin.id)
      console.log(`Plugin ${plugin.name} (${plugin.version}) loaded`)
      return true
    } catch (error) {
      console.error(`Error loading plugin ${plugin.id}:`, error)
      return false
    }
  }

  async unregisterPlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      console.warn(`Plugin ${pluginId} is not registered`)
      return false
    }

    // Check if other plugins depend on this one
    for (const [id, p] of this.plugins.entries()) {
      if (id !== pluginId && p.dependencies.includes(pluginId)) {
        console.warn(`Cannot unregister plugin ${pluginId} because ${id} depends on it`)
        return false
      }
    }

    // Unregister hooks
    for (const [hookName, callbacks] of Object.entries(plugin.hooks)) {
      const hookCallbacks = this.hooks.get(hookName)
      if (hookCallbacks) {
        for (const callback of callbacks) {
          hookCallbacks.delete(`${pluginId}:${callback}`)
        }

        if (hookCallbacks.size === 0) {
          this.hooks.delete(hookName)
        }
      }
    }

    // Unload plugin
    this.loadedPlugins.delete(pluginId)
    this.plugins.delete(pluginId)

    console.log(`Plugin ${plugin.name} (${plugin.version}) unloaded`)
    return true
  }

  async executeHook(hookName: string, context: Record<string, any> = {}) {
    const hookCallbacks = this.hooks.get(hookName)
    if (!hookCallbacks || hookCallbacks.size === 0) {
      return []
    }

    const results = []
    for (const callbackId of hookCallbacks) {
      const [pluginId, methodName] = callbackId.split(":")
      const plugin = this.plugins.get(pluginId)

      if (plugin && this.loadedPlugins.has(pluginId)) {
        try {
          // In a real implementation, you would call the actual method
          // For now, we'll just log it
          console.log(`Executing hook ${hookName} with callback ${methodName} from plugin ${pluginId}`)
          results.push({
            pluginId,
            success: true,
            result: `Executed ${methodName} from ${plugin.name}`,
          })
        } catch (error) {
          console.error(`Error executing hook ${hookName} with callback ${methodName} from plugin ${pluginId}:`, error)
          results.push({
            pluginId,
            success: false,
            error: String(error),
          })
        }
      }
    }

    return results
  }

  getPlugins() {
    return Array.from(this.plugins.values())
  }

  getPlugin(pluginId: string) {
    return this.plugins.get(pluginId)
  }

  getHooks() {
    return Array.from(this.hooks.keys())
  }

  getPluginHooks(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    return plugin ? plugin.hooks : {}
  }
}

// Create a singleton instance
export const pluginManager = new PluginManager()
