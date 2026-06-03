export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations'
import { registerUser } from '@/services/auth.service'
import { signToken, cookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = registerSchema.parse(body)
    const user = await registerUser(input)
    const token = await signToken({ userId: user.id })

    const res = NextResponse.json({ user }, { status: 201 })
    res.cookies.set({ ...cookieOptions(), value: token })
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
