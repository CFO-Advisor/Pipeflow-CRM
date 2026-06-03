'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DealStage } from '@/types'

export interface RepStageData {
  name: string
  new_lead: number
  contacted: number
  proposal_sent: number
  negotiation: number
  closed_won: number
  closed_lost: number
}

const STAGE_ORDER: DealStage[] = [
  'new_lead', 'contacted', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
]

const STAGE_COLORS: Record<DealStage, string> = {
  new_lead: '#3b82f6',
  contacted: '#60a5fa',
  proposal_sent: '#818cf8',
  negotiation: '#a78bfa',
  closed_won: '#16a34a',
  closed_lost: '#dc2626',
}

const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: 'Novo',
  contacted: 'Contato',
  proposal_sent: 'Proposta',
  negotiation: 'Negoc.',
  closed_won: 'Ganho',
  closed_lost: 'Perdido',
}

interface RepStageBreakdownProps {
  data: RepStageData[]
}

export function RepStageBreakdown({ data }: RepStageBreakdownProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const gridColor = isDark ? '#334155' : '#f1f5f9'
  const tickColor = isDark ? '#64748b' : '#94a3b8'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b'

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
        Nenhum dado disponível.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="name"
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
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
          iconType="square"
          iconSize={8}
          formatter={(value) => STAGE_LABELS[value as DealStage] ?? value}
        />
        {STAGE_ORDER.map((stage) => (
          <Bar
            key={stage}
            dataKey={stage}
            stackId="a"
            fill={STAGE_COLORS[stage]}
            name={stage}
            isAnimationActive
            animationDuration={600}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
