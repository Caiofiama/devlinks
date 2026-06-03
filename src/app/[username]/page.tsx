import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import type { Metadata } from 'next'

interface Props {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({ where: { username: params.username } })
  if (!user) return { title: 'Not Found' }
  return { title: `${user.name ?? user.username} | DevLinks` }
}

export default async function ProfilePage({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: { links: { orderBy: { order: 'asc' } } },
  })

  if (!user) notFound()

  return (
    <div data-theme={user.theme} className="min-h-screen bg-background text-foreground flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name ?? user.username} width={80} height={80} className="rounded-full object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {(user.name ?? user.username)[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{user.name ?? user.username}</h1>
            {user.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
          </div>
        </div>

        <div className="space-y-3">
          {user.links.map((link) => (
            <a
              key={link.id}
              href={`/api/click/${link.id}`}
              className="block w-full rounded-lg border bg-card text-card-foreground p-4 text-center font-medium transition-all hover:opacity-80 hover:scale-[1.02]"
            >
              {link.title}
            </a>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by <a href="/" className="underline">DevLinks</a>
        </p>
      </div>
    </div>
  )
}
