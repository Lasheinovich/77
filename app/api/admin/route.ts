import { withAuth } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

async function handler(req: Request) {
  return NextResponse.json({ message: "Admin API route" })
}

export const GET = withAuth(handler, { adminApiKeyRequired: true })
