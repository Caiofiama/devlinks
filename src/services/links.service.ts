import { prisma } from '@/lib/prisma'
import type { LinkInput } from '@/lib/validations'

const FREE_LIMIT = 5

export type LinkRecord = {
  id: string
  title: string
  url: string
  icon: string | null
  order: number
  clickCount: number
  createdAt: Date
}

export async function getLinks(userId: string): Promise<LinkRecord[]> {
  return prisma.link.findMany({
    where: { userId },
    orderBy: { order: 'asc' },
  })
}

export async function createLink(userId: string, input: LinkInput, plan: 'FREE' | 'PRO'): Promise<LinkRecord> {
  if (plan === 'FREE') {
    const count = await prisma.link.count({ where: { userId } })
    if (count >= FREE_LIMIT) throw new Error(`Free plan limited to ${FREE_LIMIT} links`)
  }

  const last = await prisma.link.findFirst({ where: { userId }, orderBy: { order: 'desc' } })
  return prisma.link.create({
    data: { userId, title: input.title, url: input.url, icon: input.icon ?? null, order: (last?.order ?? -1) + 1 },
  })
}

export async function updateLink(userId: string, linkId: string, input: Partial<LinkInput>): Promise<LinkRecord> {
  const link = await prisma.link.findUnique({ where: { id: linkId } })
  if (!link || link.userId !== userId) throw new Error('Link not found')
  return prisma.link.update({ where: { id: linkId }, data: input })
}

export async function deleteLink(userId: string, linkId: string): Promise<void> {
  const link = await prisma.link.findUnique({ where: { id: linkId } })
  if (!link || link.userId !== userId) throw new Error('Link not found')
  await prisma.link.delete({ where: { id: linkId } })
}

export async function reorderLinks(userId: string, ids: string[]): Promise<void> {
  const links = await prisma.link.findMany({ where: { userId } })
  const ownedIds = new Set(links.map((l) => l.id))
  if (ids.some((id) => !ownedIds.has(id))) throw new Error('Invalid link ids')

  await prisma.$transaction(
    ids.map((id, index) => prisma.link.update({ where: { id }, data: { order: index } }))
  )
}

export async function recordClick(linkId: string): Promise<string | null> {
  const link = await prisma.link.findUnique({ where: { id: linkId } })
  if (!link) return null
  await prisma.link.update({ where: { id: linkId }, data: { clickCount: { increment: 1 } } })
  return link.url
}
