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
  new_lead: '#3b82f6',
  contacted: '#60a5fa',
  proposal_sent: '#818cf8',
  negotiation: '#a78bfa',
  closed_won: '#16a34a',
  closed_lost: '#dc2626',
}

export function FunnelChart({ data }: FunnelChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const gridColor = isDark ? '#334155' : '#f1f5f9'
  const tickColor = isDark ? '#64748b' : '#94a3b8'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b'

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
          formatter={(value) => [value, 'Negócios']}
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
