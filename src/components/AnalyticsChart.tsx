'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Link = { title: string; clickCount: number }

interface AnalyticsChartProps {
  links: Link[]
}

export default function AnalyticsChart({ links }: AnalyticsChartProps) {
  const data = links
    .map((l) => ({ name: l.title.slice(0, 15), clicks: l.clickCount }))
    .sort((a, b) => b.clicks - a.clicks)

  if (data.every((d) => d.clicks === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-8">No clicks yet. Share your profile!</p>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
