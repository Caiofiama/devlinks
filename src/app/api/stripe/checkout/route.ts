export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/services/stripe.service'

export async function POST() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { email: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const url = await createCheckoutSession(auth.userId, user.email)
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
