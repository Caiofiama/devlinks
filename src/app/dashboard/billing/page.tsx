'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'

type User = { plan: 'FREE' | 'PRO'; email: string; stripeCustomerId?: string | null }

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then((d: { user: User }) => setUser(d.user))
  }, [])

  async function upgrade() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Falha ao criar sessão de checkout')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function portal() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Falha ao abrir portal de assinatura')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isPro = user?.plan === 'PRO'
  const hasStripeAccount = !!user?.stripeCustomerId

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {success && (
        <p className="rounded-lg bg-green-50 border border-green-200 text-green-800 p-3 text-sm">
          Bem-vindo ao PRO! Sua assinatura está ativa.
        </p>
      )}
      {canceled && (
        <p className="rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 text-sm">
          Checkout cancelado. Você continua no plano Free.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={!isPro ? 'border-primary' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Free</CardTitle>
              {!isPro && <Badge>Current</Badge>}
            </div>
            <CardDescription>$0 / month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {['Up to 5 links', 'Default theme', 'Public profile'].map((f) => (
              <div key={f} className="flex items-center gap-2"><Check size={14} className="text-green-500" />{f}</div>
            ))}
          </CardContent>
        </Card>

        <Card className={isPro ? 'border-primary' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1"><Zap size={16} className="text-yellow-500" />Pro</CardTitle>
              {isPro && <Badge>Current</Badge>}
            </div>
            <CardDescription>$9 / month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {['Unlimited links', '6 premium themes', 'Click analytics', 'Priority support'].map((f) => (
              <div key={f} className="flex items-center gap-2"><Check size={14} className="text-green-500" />{f}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        {isPro && hasStripeAccount && (
          <Button onClick={portal} disabled={loading} variant="outline" className="w-fit">
            {loading ? 'Carregando…' : 'Manage Subscription'}
          </Button>
        )}
        {isPro && !hasStripeAccount && (
          <p className="text-sm text-muted-foreground">
            Conta demo — assinatura gerenciada manualmente. Para testar o portal, crie uma conta nova e faça upgrade via Stripe.
          </p>
        )}
        {!isPro && (
          <Button onClick={upgrade} disabled={loading} className="w-fit">
            <Zap size={16} className="mr-2" />
            {loading ? 'Carregando…' : 'Upgrade to PRO — $9/month'}
          </Button>
        )}
      </div>
    </div>
  )
}
