import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { linkSchema, reorderSchema } from '@/lib/validations'
import { getLinks, createLink, reorderLinks } from '@/services/links.service'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await getLinks(auth.userId)
  return NextResponse.json({ links })
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const input = linkSchema.parse(body)
    const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { plan: true } })
    const link = await createLink(auth.userId, input, user?.plan ?? 'FREE')
    return NextResponse.json({ link }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create link'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { ids } = reorderSchema.parse(body)
    await reorderLinks(auth.userId, ids)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reorder'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
