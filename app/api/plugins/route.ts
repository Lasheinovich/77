import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pluginRegistry } from "@/lib/plugins/plugin-registry"
import { withLogging } from "@/lib/logger"
import { validateInput } from "@/lib/validation"
import { z } from "zod"

// Get all plugins
async function handleGet(req: Request) {
  try {
    // Initialize plugin registry if needed
    if (!pluginRegistry.getPlugins().length) {
      await pluginRegistry.initialize()
    }

    const plugins = pluginRegistry.getPlugins().map((plugin) => ({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      enabled: plugin.enabled,
      status: plugin.status,
      hooks: plugin.manifest.hooks,
      dependencies: plugin.manifest.dependencies,
    }))

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error("Error fetching plugins:", error)
    return NextResponse.json({ error: "Failed to fetch plugins" }, { status: 500 })
  }
}

// Install a new plugin
async function handlePost(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const schema = z.object({
      manifest: z.object({
        id: z.string(),
        name: z.string(),
        version: z.string(),
        description: z.string(),
        author: z.string(),
        main: z.string(),
        hooks: z.array(z.string()),
        dependencies: z.array(z.string()),
        settings: z.object({
          schema: z.record(z.any()),
          defaults: z.record(z.any()),
        }),
      }),
      enabled: z.boolean().optional(),
    })

    const validation = await validateInput(schema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Register plugin
    const success = await pluginRegistry.registerPlugin(validation.data.manifest, validation.data.enabled || false)

    if (!success) {
      return NextResponse.json({ error: "Failed to register plugin" }, { status: 500 })
    }

    // Store in database
    await db.from("plugins").insert({
      id: validation.data.manifest.id,
      manifest: validation.data.manifest,
      enabled: validation.data.enabled || false,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Plugin ${validation.data.manifest.name} installed successfully`,
    })
  } catch (error) {
    console.error("Error installing plugin:", error)
    return NextResponse.json({ error: "Failed to install plugin" }, { status: 500 })
  }
}

// Handler for all methods
async function handler(req: Request) {
  switch (req.method) {
    case "GET":
      return handleGet(req)
    case "POST":
      return handlePost(req)
    default:
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }
}

export const GET = withLogging(handleGet)
export const POST = withLogging(handlePost)
