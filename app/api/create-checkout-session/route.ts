import { NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { priceId, userId, email } = await req.json()

    if (!priceId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Check if user exists
    const { data: user } = await db.from("users").select("*").eq("id", userId).single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create checkout session
    const session = await createCheckoutSession({
      priceId,
      userId,
      metadata: {
        userId,
        email: email || user.email,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 })
  }
}
