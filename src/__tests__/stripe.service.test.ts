import { createCheckoutSession, createPortalSession, handleWebhookEvent } from '@/services/stripe.service'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    subscription: { upsert: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  },
}))

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
    billingPortal: { sessions: { create: jest.fn() } },
    subscriptions: { retrieve: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  },
}))

const mockUser = {
  id: 'user_1',
  email: 'test@example.com',
  stripeCustomerId: null,
  plan: 'FREE' as const,
  username: 'test',
  password: '',
  name: null,
  bio: null,
  avatar: null,
  theme: 'default',
  createdAt: new Date(),
}

describe('stripe.service', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('createCheckoutSession', () => {
    it('creates Stripe customer when none exists', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      jest.mocked(stripe.customers.create).mockResolvedValue({ id: 'cus_new' } as never)
      jest.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new' })
      jest.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' } as never)

      const url = await createCheckoutSession('user_1', 'test@example.com')

      expect(stripe.customers.create).toHaveBeenCalledWith({ email: 'test@example.com', metadata: { userId: 'user_1' } })
      expect(url).toBe('https://checkout.stripe.com/pay/cs_test')
    })

    it('reuses existing Stripe customer', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_existing' })
      jest.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' } as never)

      await createCheckoutSession('user_1', 'test@example.com')

      expect(stripe.customers.create).not.toHaveBeenCalled()
    })

    it('throws when user not found', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(createCheckoutSession('nope', 'x@x.com')).rejects.toThrow('User not found')
    })
  })

  describe('createPortalSession', () => {
    it('returns portal URL', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_123' })
      jest.mocked(stripe.billingPortal.sessions.create).mockResolvedValue({ url: 'https://billing.stripe.com/p/session' } as never)

      const url = await createPortalSession('user_1')
      expect(url).toBe('https://billing.stripe.com/p/session')
    })

    it('throws when no billing account', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      await expect(createPortalSession('user_1')).rejects.toThrow('No billing account found')
    })
  })

  describe('handleWebhookEvent', () => {
    it('throws on invalid signature', async () => {
      jest.mocked(stripe.webhooks.constructEvent).mockImplementation(() => { throw new Error('sig') })

      await expect(handleWebhookEvent('body', 'bad_sig')).rejects.toThrow('Invalid webhook signature')
    })

    it('handles checkout.session.completed', async () => {
      const mockSub = {
        id: 'sub_1',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        items: { data: [{ price: { id: 'price_test' } }] },
        metadata: {},
      }
      jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { mode: 'subscription', subscription: 'sub_1', metadata: { userId: 'user_1' } } },
      } as never)
      jest.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSub as never)
      jest.mocked(prisma.subscription.upsert).mockResolvedValue({} as never)
      jest.mocked(prisma.user.update).mockResolvedValue(mockUser)

      await handleWebhookEvent('body', 'sig')

      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })
})
