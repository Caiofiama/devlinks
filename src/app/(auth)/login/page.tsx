'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const DEMO = { email: 'demo@devlinks.dev', password: 'Demo@123' }

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  function fillDemo() {
    setValue('email', DEMO.email)
    setValue('password', DEMO.password)
  }

  async function onSubmit(data: LoginInput) {
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      const json = await res.json() as { error?: string }
      setError(json.error ?? 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your DevLinks account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Demo account</p>
            <p className="text-xs text-blue-600">
              <span className="font-mono">demo@devlinks.dev</span> / <span className="font-mono">Demo@123</span>
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-2 text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
            >
              Click to fill automatically
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            No account?{' '}
            <Link href="/register" className="underline">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
