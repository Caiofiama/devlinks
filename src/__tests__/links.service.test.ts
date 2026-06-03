import { getLinks, createLink, updateLink, deleteLink, reorderLinks, recordClick } from '@/services/links.service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    link: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const baseLink = {
  id: 'link_1',
  userId: 'user_1',
  title: 'GitHub',
  url: 'https://github.com',
  icon: 'github',
  order: 0,
  clickCount: 0,
  createdAt: new Date(),
}

describe('links.service', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getLinks', () => {
    it('returns links ordered by order', async () => {
      jest.mocked(prisma.link.findMany).mockResolvedValue([baseLink])
      const links = await getLinks('user_1')
      expect(links).toHaveLength(1)
      expect(prisma.link.findMany).toHaveBeenCalledWith({ where: { userId: 'user_1' }, orderBy: { order: 'asc' } })
    })
  })

  describe('createLink', () => {
    it('creates link for PRO user ignoring count', async () => {
      jest.mocked(prisma.link.findFirst).mockResolvedValue(baseLink)
      jest.mocked(prisma.link.create).mockResolvedValue({ ...baseLink, order: 1 })

      const link = await createLink('user_1', { title: 'Twitter', url: 'https://x.com' }, 'PRO')
      expect(link.order).toBe(1)
      expect(prisma.link.count).not.toHaveBeenCalled()
    })

    it('throws for FREE user at limit', async () => {
      jest.mocked(prisma.link.count).mockResolvedValue(5)

      await expect(
        createLink('user_1', { title: 'Twitter', url: 'https://x.com' }, 'FREE')
      ).rejects.toThrow('Free plan limited to 5 links')
    })

    it('creates link for FREE user under limit', async () => {
      jest.mocked(prisma.link.count).mockResolvedValue(2)
      jest.mocked(prisma.link.findFirst).mockResolvedValue(null)
      jest.mocked(prisma.link.create).mockResolvedValue(baseLink)

      const link = await createLink('user_1', { title: 'GitHub', url: 'https://github.com' }, 'FREE')
      expect(link.id).toBe('link_1')
    })
  })

  describe('updateLink', () => {
    it('updates own link', async () => {
      jest.mocked(prisma.link.findUnique).mockResolvedValue(baseLink)
      jest.mocked(prisma.link.update).mockResolvedValue({ ...baseLink, title: 'Updated' })

      const link = await updateLink('user_1', 'link_1', { title: 'Updated' })
      expect(link.title).toBe('Updated')
    })

    it('throws when link not owned', async () => {
      jest.mocked(prisma.link.findUnique).mockResolvedValue({ ...baseLink, userId: 'other_user' })

      await expect(updateLink('user_1', 'link_1', { title: 'Bad' })).rejects.toThrow('Link not found')
    })
  })

  describe('deleteLink', () => {
    it('deletes own link', async () => {
      jest.mocked(prisma.link.findUnique).mockResolvedValue(baseLink)
      jest.mocked(prisma.link.delete).mockResolvedValue(baseLink)

      await deleteLink('user_1', 'link_1')
      expect(prisma.link.delete).toHaveBeenCalledWith({ where: { id: 'link_1' } })
    })

    it('throws when link not found', async () => {
      jest.mocked(prisma.link.findUnique).mockResolvedValue(null)

      await expect(deleteLink('user_1', 'link_1')).rejects.toThrow('Link not found')
    })
  })

  describe('reorderLinks', () => {
    it('throws on invalid link ids', async () => {
      jest.mocked(prisma.link.findMany).mockResolvedValue([baseLink])

      await expect(reorderLinks('user_1', ['link_1', 'link_FAKE'])).rejects.toThrow('Invalid link ids')
    })

    it('reorders valid links', async () => {
      const links = [baseLink, { ...baseLink, id: 'link_2', order: 1 }]
      jest.mocked(prisma.link.findMany).mockResolvedValue(links)
      jest.mocked(prisma.$transaction).mockResolvedValue([])

      await reorderLinks('user_1', ['link_2', 'link_1'])
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('recordClick', () => {
    it('increments click and returns url', async () => {
      jest.mocked(prisma.link.findUnique).mockResolvedValue(baseLink)
      jest.mocked(prisma.link.update).mockResolvedValue({ ...baseLink, clickCount: 1 })

      const url = await recordClick('link_1')
      expect(url).toBe('https://github.com')
    })

    it('returns null for missing link', async () => {
      jest.mocked(prisma.link.findUnique).mockResolvedValue(null)
      const url = await recordClick('nope')
      expect(url).toBeNull()
    })
  })
})
