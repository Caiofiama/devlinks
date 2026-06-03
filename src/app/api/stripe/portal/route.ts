export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createPortalSession } from '@/services/stripe.service'

export async function POST() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const url = await createPortalSession(auth.userId)
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
