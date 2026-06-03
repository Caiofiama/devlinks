import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function createCheckoutSession(userId: string, email: string): Promise<string> {
  let user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { userId } })
    customerId = customer.id
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env['STRIPE_PRO_PRICE_ID'], quantity: 1 }],
    success_url: `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard/billing?success=1`,
    cancel_url: `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard/billing?canceled=1`,
    metadata: { userId },
  })

  if (!session.url) throw new Error('Failed to create checkout session')
  return session.url
}

export async function createPortalSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.stripeCustomerId) throw new Error('No billing account found')

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard/billing`,
  })

  return session.url
}

export async function handleWebhookEvent(rawBody: string, signature: string): Promise<void> {
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'] ?? ''
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    throw new Error('Invalid webhook signature')
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const subscriptionId = session.subscription as string
      const userId = session.metadata?.['userId']
      if (!userId) break

      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = sub.items.data[0]?.price.id ?? ''
      const periodEnd = new Date((sub.current_period_end) * 1000)

      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            status: sub.status,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            status: sub.status,
            currentPeriodEnd: periodEnd,
          },
        }),
        prisma.user.update({ where: { id: userId }, data: { plan: 'PRO' } }),
      ])
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.['userId'] ?? await getUserIdFromCustomer(sub.customer as string)
      if (!userId) break

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: sub.status, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = await getUserIdFromCustomer(sub.customer as string)
      if (!userId) break

      await prisma.$transaction([
        prisma.subscription.deleteMany({ where: { stripeSubscriptionId: sub.id } }),
        prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } }),
      ])
      break
    }
  }
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
  return user?.id ?? null
}
