import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { generateInvoicePdf } from "@/lib/invoice-generator"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "")
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const checkoutSession = event.data.object
      await handleCheckoutSessionCompleted(checkoutSession)
      break
    case "customer.subscription.created":
      const subscriptionCreated = event.data.object
      await handleSubscriptionCreated(subscriptionCreated)
      break
    case "customer.subscription.updated":
      const subscriptionUpdated = event.data.object
      await handleSubscriptionUpdated(subscriptionUpdated)
      break
    case "customer.subscription.deleted":
      const subscriptionDeleted = event.data.object
      await handleSubscriptionDeleted(subscriptionDeleted)
      break
    case "invoice.paid":
      const invoicePaid = event.data.object
      await handleInvoicePaid(invoicePaid)
      break
    case "invoice.payment_failed":
      const invoiceFailed = event.data.object
      await handleInvoicePaymentFailed(invoiceFailed)
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutSessionCompleted(session: any) {
  const userId = session.metadata.userId
  const customerId = session.customer
  const subscriptionId = session.subscription

  // Update user with Stripe customer
  try {
    await db
      .from("users")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    // Create subscription record
    await db.from("subscriptions").insert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: "active",
      created_at: new Date().toISOString(),
    })

    console.log(`User ${userId} subscription activated: ${subscriptionId}`)
  } catch (error) {
    console.error("Error updating user subscription:", error)
  }
}

async function handleSubscriptionCreated(subscription: any) {
  const customerId = subscription.customer
  const subscriptionId = subscription.id
  const status = subscription.status
  const priceId = subscription.items.data[0].price.id

  try {
    // Get user by customer ID
    const { data: userData } = await db.from("users").select("id").eq("stripe_customer_id", customerId).single()

    if (!userData) {
      console.error(`No user found for customer: ${customerId}`)
      return
    }

    // Update subscription record
    await db.from("subscriptions").insert(
      {
        user_id: userData.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        status,
        created_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    )

    console.log(`Subscription created: ${subscriptionId} for user ${userData.id}`)
  } catch (error) {
    console.error("Error handling subscription created:", error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const subscriptionId = subscription.id
  const status = subscription.status
  const priceId = subscription.items.data[0].price.id

  try {
    // Update subscription record
    await db
      .from("subscriptions")
      .update({
        status,
        stripe_price_id: priceId,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)

    // Update user subscription status
    const { data: subscriptionData } = await db
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .single()

    if (subscriptionData) {
      await db
        .from("users")
        .update({
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionData.user_id)
    }

    console.log(`Subscription updated: ${subscriptionId} with status ${status}`)
  } catch (error) {
    console.error("Error handling subscription updated:", error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const subscriptionId = subscription.id

  try {
    // Update subscription record
    await db
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)

    // Update user subscription status
    const { data: subscriptionData } = await db
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .single()

    if (subscriptionData) {
      await db
        .from("users")
        .update({
          subscription_status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionData.user_id)
    }

    console.log(`Subscription canceled: ${subscriptionId}`)
  } catch (error) {
    console.error("Error handling subscription deleted:", error)
  }
}

async function handleInvoicePaid(invoice: any) {
  const customerId = invoice.customer
  const invoiceId = invoice.id
  const amount = invoice.amount_paid
  const invoicePdf = invoice.invoice_pdf

  try {
    // Get user by customer ID
    const { data: userData } = await db.from("users").select("id, email").eq("stripe_customer_id", customerId).single()

    if (!userData) {
      console.error(`No user found for customer: ${customerId}`)
      return
    }

    // Generate invoice PDF
    const invoiceData = {
      invoiceId,
      customerId,
      userId: userData.id,
      userEmail: userData.email,
      amount: amount / 100, // Convert from cents
      date: new Date().toISOString(),
      items: invoice.lines.data,
    }

    const pdfBuffer = await generateInvoicePdf(invoiceData)

    // Store invoice in database
    await db.from("invoices").insert({
      user_id: userData.id,
      stripe_invoice_id: invoiceId,
      stripe_customer_id: customerId,
      amount: amount / 100,
      status: "paid",
      pdf_url: invoicePdf,
      created_at: new Date().toISOString(),
    })

    console.log(`Invoice paid: ${invoiceId} for user ${userData.id}`)
  } catch (error) {
    console.error("Error handling invoice paid:", error)
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const customerId = invoice.customer
  const invoiceId = invoice.id

  try {
    // Get user by customer ID
    const { data: userData } = await db.from("users").select("id").eq("stripe_customer_id", customerId).single()

    if (!userData) {
      console.error(`No user found for customer: ${customerId}`)
      return
    }

    // Store invoice in database
    await db.from("invoices").insert({
      user_id: userData.id,
      stripe_invoice_id: invoiceId,
      stripe_customer_id: customerId,
      amount: invoice.amount_due / 100,
      status: "failed",
      created_at: new Date().toISOString(),
    })

    console.log(`Invoice payment failed: ${invoiceId} for user ${userData.id}`)
  } catch (error) {
    console.error("Error handling invoice payment failed:", error)
  }
}
