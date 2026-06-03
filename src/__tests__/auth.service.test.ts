import { registerUser, loginUser, getUserById } from '@/services/auth.service'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}))

const mockUser = {
  id: 'user_1',
  email: 'test@example.com',
  password: 'hashed_password',
  username: 'testuser',
  name: 'Test User',
  bio: null,
  avatar: null,
  theme: 'default',
  plan: 'FREE' as const,
  stripeCustomerId: null,
  createdAt: new Date(),
}

describe('auth.service', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('registerUser', () => {
    it('creates a new user', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(null)
      jest.mocked(prisma.user.create).mockResolvedValue(mockUser)

      const result = await registerUser({ email: 'test@example.com', password: 'Password1', username: 'testuser' })

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: 'test@example.com', username: 'testuser', password: 'hashed_password' }),
      })
      expect(result.email).toBe('test@example.com')
      expect(result).not.toHaveProperty('password')
    })

    it('throws if email already exists', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser)

      await expect(
        registerUser({ email: 'test@example.com', password: 'Password1', username: 'other' })
      ).rejects.toThrow('Email already in use')
    })

    it('throws if username already exists', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue({ ...mockUser, email: 'other@example.com' })

      await expect(
        registerUser({ email: 'new@example.com', password: 'Password1', username: 'testuser' })
      ).rejects.toThrow('Username already taken')
    })
  })

  describe('loginUser', () => {
    it('returns safe user on valid credentials', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const result = await loginUser({ email: 'test@example.com', password: 'Password1' })
      expect(result.id).toBe('user_1')
    })

    it('throws on wrong password', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never)

      await expect(loginUser({ email: 'test@example.com', password: 'Wrong' })).rejects.toThrow('Invalid credentials')
    })

    it('throws when user not found', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(loginUser({ email: 'nope@example.com', password: 'Password1' })).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getUserById', () => {
    it('returns safe user when found', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      const result = await getUserById('user_1')
      expect(result?.id).toBe('user_1')
    })

    it('returns null when not found', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null)
      const result = await getUserById('nope')
      expect(result).toBeNull()
    })
  })
})
