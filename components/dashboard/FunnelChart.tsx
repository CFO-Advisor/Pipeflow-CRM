'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { DealStage } from '@/types'

interface FunnelChartProps {
  data: Array<{ stage: DealStage; label: string; count: number }>
}

const stageColors: Record<DealStage, string> = {
  new_lead: '#0d9488',
  contacted: '#60a5fa',
  proposal_sent: '#818cf8',
  negotiation: '#a78bfa',
  closed_won: '#16a34a',
  closed_lost: '#dc2626',
}

export function FunnelChart({ data }: FunnelChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const isEmpty = total === 0

  const gridColor = isDark ? '#334155' : '#f1f5f9'
  const tickColor = isDark ? '#64748b' : '#94a3b8'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b'

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] text-center gap-2">
        <p className="text-muted-foreground text-sm">Nenhum negócio no pipeline ainda.</p>
        <p className="text-xs text-muted-foreground/70">Crie seu primeiro negócio na página Pipeline.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 10,
            border: `1px solid ${tooltipBorder}`,
            backgroundColor: tooltipBg,
            color: tooltipText,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => {
            const num = Number(value) || 0
            const pct = total > 0 ? Math.round((num / total) * 100) : 0
            return [`${num} (${pct}% do total)`, 'Negócios']
          }}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600} animationEasing="ease-out">
          {data.map((entry) => (
            <Cell key={entry.stage} fill={stageColors[entry.stage]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
