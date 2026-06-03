export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { recordClick } from '@/services/links.service'

export async function GET(_req: NextRequest, { params }: { params: { linkId: string } }) {
  const url = await recordClick(params.linkId)
  if (!url) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  return NextResponse.redirect(url)
}
