import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { linkSchema } from '@/lib/validations'
import { updateLink, deleteLink } from '@/services/links.service'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const input = linkSchema.partial().parse(body)
    const link = await updateLink(auth.userId, params.id, input)
    return NextResponse.json({ link })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await deleteLink(auth.userId, params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
