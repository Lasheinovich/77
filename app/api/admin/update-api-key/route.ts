import { withAuth } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

async function handler(req: Request) {
  if (req.method === "POST") {
    try {
      const { newApiKey } = await req.json()

      if (!newApiKey) {
        return new NextResponse(JSON.stringify({ error: "New API key is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Update the ADMIN_API_KEY in your environment variables
      process.env.ADMIN_API_KEY = newApiKey

      // You might also want to save the new API key to your database
      // to persist it across deployments

      return new NextResponse(JSON.stringify({ message: "API key updated successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error updating API key:", error)
      return new NextResponse(JSON.stringify({ error: "Failed to update API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } else {
    return new NextResponse(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export const POST = withAuth(handler, { adminApiKeyRequired: true })
