import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validations'
import { loginUser } from '@/services/auth.service'
import { signToken, cookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = loginSchema.parse(body)
    const user = await loginUser(input)
    const token = await signToken({ userId: user.id })

    const res = NextResponse.json({ user })
    res.cookies.set({ ...cookieOptions(), value: token })
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
