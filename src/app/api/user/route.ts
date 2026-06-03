export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { settingsSchema, themeSchema } from '@/lib/validations'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, username: true, name: true, bio: true, avatar: true, theme: true, plan: true, stripeCustomerId: true },
  })
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    if ('theme' in body) {
      const { theme } = themeSchema.parse(body)
      const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { plan: true } })
      if (user?.plan !== 'PRO' && theme !== 'default') {
        return NextResponse.json({ error: 'PRO plan required for custom themes' }, { status: 403 })
      }
      await prisma.user.update({ where: { id: auth.userId }, data: { theme } })
      return NextResponse.json({ ok: true })
    }

    const input = settingsSchema.parse(body)

    if (input.username) {
      const existing = await prisma.user.findUnique({ where: { username: input.username } })
      if (existing && existing.id !== auth.userId) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: { ...input },
      select: { id: true, email: true, username: true, name: true, bio: true, avatar: true, theme: true, plan: true },
    })
    return NextResponse.json({ user: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
