export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent } from '@/services/stripe.service'

// Raw body required for Stripe signature verification — do NOT use req.json()
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  try {
    await handleWebhookEvent(rawBody, signature)
    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
