import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { captureError } from "@/lib/error-tracking"

// Define settings schema types
export type SettingValueType = string | number | boolean | null | Record<string, unknown> | Array<unknown>;

// Schema for plugin settings
export interface PluginSettingsSchema {
  type: string;
  properties: Record<string, {
    type: string;
    description?: string;
    default?: SettingValueType;
    required?: boolean;
    enum?: string[];
    minimum?: number;
    maximum?: number;
    pattern?: string;
  }>;
  required?: string[];
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  repository?: string
  license?: string
  main: string
  hooks: string[]
  dependencies: string[]
  settings: {
    schema: PluginSettingsSchema
    defaults: Record<string, SettingValueType>
  }
  capabilities: string[]
  permissions: string[]
}

// Define plugin hook handler type
export type PluginHookHandler = (context: Record<string, unknown>) => Promise<unknown>;

// Define plugin implementation interface
export interface PluginImplementation {
  initialize: (settings: Record<string, SettingValueType>) => Promise<boolean>;
  [hookName: string]: PluginHookHandler;
}

export interface PluginInstance {
  manifest: PluginManifest
  instance: PluginImplementation
  enabled: boolean
  settings: Record<string, SettingValueType>
  status: "active" | "inactive" | "error"
  error?: Error
}

// Define hook result type
export interface HookResult {
  pluginId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

class PluginRegistry {
  private static instance: PluginRegistry
  private plugins: Map<string, PluginInstance> = new Map()
  private hooks: Map<string, Set<{ pluginId: string; method: string }>> = new Map()
  private initialized = false

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry()
    }
    return PluginRegistry.instance
  }

  /**
   * Initialize the plugin registry
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      logger.info("Initializing plugin registry")

      // Load plugins from database
      const { data: pluginsData, error } = await db.from("plugins").select("*")

      if (error) {
        throw error
      }

      // Register each plugin
      for (const pluginData of pluginsData) {
        try {
          await this.registerPlugin(pluginData.manifest, pluginData.enabled)
        } catch (error) {
          logger.error(`Failed to register plugin ${pluginData.manifest.id}`, { error })
          captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
            component: "PluginRegistry",
            operation: "registerPlugin",
            pluginId: pluginData.manifest.id,
          })
        }
      }

      this.initialized = true
      logger.info(`Plugin registry initialized with ${this.plugins.size} plugins`)
    } catch (error) {
      logger.error("Failed to initialize plugin registry", { error })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "PluginRegistry",
        operation: "initialize",
      })
    }
  }

  /**
   * Register a plugin
   */
  public async registerPlugin(manifest: PluginManifest, enabled = false): Promise<boolean> {
    try {
      // Validate manifest
      this.validateManifest(manifest)

      // Check if plugin is already registered
      if (this.plugins.has(manifest.id)) {
        logger.warn(`Plugin ${manifest.id} is already registered`)
        return false
      }

      // Check dependencies
      for (const dependency of manifest.dependencies) {
        if (!this.plugins.has(dependency)) {
          logger.warn(`Plugin ${manifest.id} depends on ${dependency}, which is not registered`)
          return false
        }
      }

      // Load plugin module
      let pluginInstance
      try {
        // In a real implementation, this would dynamically import the plugin
        // For now, we'll create a mock instance
        pluginInstance = {
          initialize: async (settings: Record<string, SettingValueType>) => {
            logger.info(`Initializing plugin ${manifest.id}`)
            return true
          },
          // Add mock methods for each hook
          ...manifest.hooks.reduce(
            (acc, hook) => {
              acc[hook] = async (context: Record<string, unknown>) => {
                logger.debug(`Executing hook ${hook} for plugin ${manifest.id}`)
                return { success: true, data: `Mock response from ${manifest.id}.${hook}` }
              }
              return acc
            },
            {} as Record<string, PluginHookHandler>,
          ),
        }
      } catch (error) {
        logger.error(`Failed to load plugin module for ${manifest.id}`, { error })
        throw error
      }

      // Initialize plugin with settings
      const { data: settingsData } = await db
        .from("plugin_settings")
        .select("settings")
        .eq("plugin_id", manifest.id)
        .single()

      const settings = settingsData?.settings || manifest.settings.defaults

      try {
        await pluginInstance.initialize(settings)
      } catch (error) {
        logger.error(`Failed to initialize plugin ${manifest.id}`, { error })
        throw error
      }

      // Register plugin
      this.plugins.set(manifest.id, {
        manifest,
        instance: pluginInstance,
        enabled,
        settings,
        status: enabled ? "active" : "inactive",
      })

      // Register hooks
      for (const hook of manifest.hooks) {
        if (!this.hooks.has(hook)) {
          this.hooks.set(hook, new Set())
        }
        this.hooks.get(hook)?.add({ pluginId: manifest.id, method: hook })
      }

      logger.info(`Plugin ${manifest.name} (${manifest.version}) registered successfully`)
      return true
    } catch (error) {
      logger.error(`Failed to register plugin ${manifest.id}`, { error })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "PluginRegistry",
        operation: "registerPlugin",
        pluginId: manifest.id,
      })
      return false
    }
  }

  /**
   * Unregister a plugin
   */
  public async unregisterPlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        logger.warn(`Plugin ${pluginId} is not registered`)
        return false
      }

      // Check if other plugins depend on this one
      for (const [id, p] of this.plugins.entries()) {
        if (id !== pluginId && p.manifest.dependencies.includes(pluginId)) {
          logger.warn(`Cannot unregister plugin ${pluginId} because ${id} depends on it`)
          return false
        }
      }

      // Unregister hooks
      for (const hook of plugin.manifest.hooks) {
        const hookSet = this.hooks.get(hook)
        if (hookSet) {
          for (const entry of hookSet) {
            if (entry.pluginId === pluginId) {
              hookSet.delete(entry)
            }
          }
          if (hookSet.size === 0) {
            this.hooks.delete(hook)
          }
        }
      }

      // Remove plugin
      this.plugins.delete(pluginId)

      logger.info(`Plugin ${pluginId} unregistered successfully`)
      return true
    } catch (error) {
      logger.error(`Failed to unregister plugin ${pluginId}`, { error })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "PluginRegistry",
        operation: "unregisterPlugin",
        pluginId,
      })
      return false
    }
  }

  /**
   * Enable a plugin
   */
  public async enablePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        logger.warn(`Plugin ${pluginId} is not registered`)
        return false
      }

      // Check dependencies
      for (const dependency of plugin.manifest.dependencies) {
        const depPlugin = this.plugins.get(dependency)
        if (!depPlugin || !depPlugin.enabled) {
          logger.warn(`Cannot enable plugin ${pluginId} because dependency ${dependency} is not enabled`)
          return false
        }
      }

      // Update plugin status
      plugin.enabled = true
      plugin.status = "active"

      // Update database
      await db.from("plugins").update({ enabled: true }).eq("id", pluginId)

      logger.info(`Plugin ${pluginId} enabled successfully`)
      return true
    } catch (error) {
      logger.error(`Failed to enable plugin ${pluginId}`, { error })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "PluginRegistry",
        operation: "enablePlugin",
        pluginId,
      })
      return false
    }
  }

  /**
   * Disable a plugin
   */
  public async disablePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        logger.warn(`Plugin ${pluginId} is not registered`)
        return false
      }

      // Check if other plugins depend on this one
      for (const [id, p] of this.plugins.entries()) {
        if (id !== pluginId && p.enabled && p.manifest.dependencies.includes(pluginId)) {
          logger.warn(`Cannot disable plugin ${pluginId} because ${id} depends on it`)
          return false
        }
      }

      // Update plugin status
      plugin.enabled = false
      plugin.status = "inactive"

      // Update database
      await db.from("plugins").update({ enabled: false }).eq("id", pluginId)

      logger.info(`Plugin ${pluginId} disabled successfully`)
      return true
    } catch (error) {
      logger.error(`Failed to disable plugin ${pluginId}`, { error })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "PluginRegistry",
        operation: "disablePlugin",
        pluginId,
      })
      return false
    }
  }

  /**
   * Execute a hook
   */
  public async executeHook(hook: string, context: Record<string, unknown> = {}): Promise<HookResult[]> {
    try {
      const hookEntries = this.hooks.get(hook)
      if (!hookEntries || hookEntries.size === 0) {
        return []
      }

      const results: HookResult[] = []
      for (const { pluginId, method } of hookEntries) {
        const plugin = this.plugins.get(pluginId)
        if (!plugin || !plugin.enabled) continue

        try {
          const result = await plugin.instance[method](context)
          results.push({
            pluginId,
            success: true,
            data: result,
          })
        } catch (error) {
          logger.error(`Error executing hook ${hook} for plugin ${pluginId}`, { error })
          captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
            component: "PluginRegistry",
            operation: "executeHook",
            pluginId,
            hook,
          })
          results.push({
            pluginId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      return results
    } catch (error) {
      logger.error(`Failed to execute hook ${hook}`, { error })
      captureError(error instanceof Error ? error : new Error(String(error)), undefined, {
        component: "PluginRegistry",
        operation: "executeHook",
        hook,
      })
      return []
    }
  }

  /**
   * Get all registered plugins
   */
  public getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get a specific plugin
   */
  public getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all registered hooks
   */
  public getHooks(): string[] {
    return Array.from(this.hooks.keys())
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    // Basic validation
    if (!manifest.id) throw new Error("Plugin manifest missing id")
    if (!manifest.name) throw new Error("Plugin manifest missing name")
    if (!manifest.version) throw new Error("Plugin manifest missing version")
    if (!manifest.description) throw new Error("Plugin manifest missing description")
    if (!manifest.author) throw new Error("Plugin manifest missing author")
    if (!manifest.main) throw new Error("Plugin manifest missing main entry point")
    if (!Array.isArray(manifest.hooks)) throw new Error("Plugin manifest hooks must be an array")
    if (!Array.isArray(manifest.dependencies)) throw new Error("Plugin manifest dependencies must be an array")
    if (!manifest.settings) throw new Error("Plugin manifest missing settings")
    if (!manifest.settings.schema) throw new Error("Plugin manifest missing settings schema")
    if (!manifest.settings.defaults) throw new Error("Plugin manifest missing settings defaults")
  }
}

// Export singleton instance
export const pluginRegistry = PluginRegistry.getInstance()
