import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function createCheckoutSession(options: {
  priceId: string
  userId: string
  metadata?: Record<string, string>
  successUrl?: string
  cancelUrl?: string
}) {
  const { priceId, userId, metadata = {}, successUrl, cancelUrl } = options

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    customer_email: metadata.email,
    client_reference_id: userId,
    metadata: {
      userId,
      ...metadata,
    },
  })

  return session
}

export async function createBillingPortalSession(options: {
  customerId: string
  returnUrl?: string
}) {
  const { customerId, returnUrl } = options

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return session
}

export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

export async function getCustomer(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId)
  return customer
}

export async function createCustomer(options: {
  email: string
  name?: string
  metadata?: Record<string, string>
}) {
  const { email, name, metadata } = options

  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  })

  return customer
}

export async function updateCustomer(
  customerId: string,
  options: {
    email?: string
    name?: string
    metadata?: Record<string, string>
  },
) {
  const { email, name, metadata } = options

  const customer = await stripe.customers.update(customerId, {
    email,
    name,
    metadata,
  })

  return customer
}

export async function getInvoices(customerId: string) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  })

  return invoices
}

export async function getUpcomingInvoice(customerId: string) {
  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: customerId,
  })

  return invoice
}
