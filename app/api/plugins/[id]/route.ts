import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pluginRegistry } from "@/lib/plugins/plugin-registry"
import { withLogging } from "@/lib/logger"

// Get a specific plugin
async function handleGet(req: Request, { params }: { params: { id: string } }) {
  try {
    const pluginId = params.id
    const plugin = pluginRegistry.getPlugin(pluginId)

    if (!plugin) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      enabled: plugin.enabled,
      status: plugin.status,
      hooks: plugin.manifest.hooks,
      dependencies: plugin.manifest.dependencies,
      settings: plugin.settings,
    })
  } catch (error) {
    console.error(`Error fetching plugin ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch plugin" }, { status: 500 })
  }
}

// Update a plugin
async function handlePatch(req: Request, { params }: { params: { id: string } }) {
  try {
    const pluginId = params.id
    const { enabled, settings } = await req.json()

    // Check if plugin exists
    const plugin = pluginRegistry.getPlugin(pluginId)
    if (!plugin) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
    }

    let success = true
    const message = "Plugin updated successfully"

    // Update enabled status if provided
    if (enabled !== undefined) {
      if (enabled) {
        success = await pluginRegistry.enablePlugin(pluginId)
        if (!success) {
          return NextResponse.json({ error: "Failed to enable plugin" }, { status: 500 })
        }
      } else {
        success = await pluginRegistry.disablePlugin(pluginId)
        if (!success) {
          return NextResponse.json({ error: "Failed to disable plugin" }, { status: 500 })
        }
      }
    }

    // Update settings if provided
    if (settings) {
      // In a real implementation, validate settings against schema
      await db.from("plugin_settings").upsert({
        plugin_id: pluginId,
        settings,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success,
      message,
    })
  } catch (error) {
    console.error(`Error updating plugin ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update plugin" }, { status: 500 })
  }
}

// Delete a plugin
async function handleDelete(req: Request, { params }: { params: { id: string } }) {
  try {
    const pluginId = params.id

    // Unregister plugin
    const success = await pluginRegistry.unregisterPlugin(pluginId)
    if (!success) {
      return NextResponse.json({ error: "Failed to unregister plugin" }, { status: 500 })
    }

    // Remove from database
    await db.from("plugins").delete().eq("id", pluginId)
    await db.from("plugin_settings").delete().eq("plugin_id", pluginId)

    return NextResponse.json({
      success: true,
      message: "Plugin uninstalled successfully",
    })
  } catch (error) {
    console.error(`Error deleting plugin ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to uninstall plugin" }, { status: 500 })
  }
}

// Handler for all methods
export const GET = withLogging((req: Request, { params }: { params: { id: string } }) => handleGet(req, { params }))
export const PATCH = withLogging((req: Request, { params }: { params: { id: string } }) => handlePatch(req, { params }))
export const DELETE = withLogging((req: Request, { params }: { params: { id: string } }) =>
  handleDelete(req, { params }),
)
