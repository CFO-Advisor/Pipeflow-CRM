'use client'

import { useState } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

export interface RepMetric {
  name: string
  pipelineValue: number
  wonDeals: number
  conversionRate: number
}

type MetricKey = 'pipelineValue' | 'wonDeals' | 'conversionRate'

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'pipelineValue', label: 'Pipeline (R$)' },
  { key: 'wonDeals', label: 'Negócios Ganhos' },
  { key: 'conversionRate', label: 'Conversão (%)' },
]

const RANK_COLORS = ['#f59e0b', '#9ca3af', '#b45309', '#6b7280']

interface RepLeaderboardProps {
  reps: RepMetric[]
}

export function RepLeaderboard({ reps }: RepLeaderboardProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [metric, setMetric] = useState<MetricKey>('pipelineValue')

  const tickColor = isDark ? '#64748b' : '#94a3b8'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b'

  const sorted = [...reps]
    .sort((a, b) => b[metric] - a[metric])
    .map((rep, index) => ({ ...rep, rank: index + 1 }))

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
        Nenhum representante com negócios ainda.
      </div>
    )
  }

  const formatValue = (v: number) => {
    if (metric === 'pipelineValue') return formatCurrency(v)
    if (metric === 'conversionRate') return `${v.toFixed(0)}%`
    return String(v)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        {METRIC_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMetric(opt.key)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              metric === opt.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={Math.max(sorted.length * 36 + 20, 120)}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
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
            formatter={(value: any) => [formatValue(Number(value) || 0), METRIC_OPTIONS.find(o => o.key === metric)?.label ?? '']}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
          />
          <Bar dataKey={metric} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600} label={{ position: 'right', fontSize: 10, fill: tickColor, formatter: (v: unknown) => formatValue(Number(v) || 0) }}>
            {sorted.map((entry) => (
              <Cell
                key={entry.name}
                fill={RANK_COLORS[Math.min(entry.rank - 1, RANK_COLORS.length - 1)]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
