'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

export interface MonthlyRevenuePoint {
  month: string
  revenue: number
}

interface MonthlyRevenueChartProps {
  data: MonthlyRevenuePoint[]
}

function formatK(value: number): string {
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value}`
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const gridColor = isDark ? '#334155' : '#f1f5f9'
  const tickColor = isDark ? '#64748b' : '#94a3b8'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b'

  const avg = data.length > 0
    ? data.reduce((sum, d) => sum + d.revenue, 0) / data.length
    : 0

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
        Nenhuma receita registrada no período.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatK}
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
          formatter={(value: any) => [
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0),
            'Receita ganha',
          ]}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
        />
        <ReferenceLine
          y={avg}
          stroke={isDark ? '#64748b' : '#94a3b8'}
          strokeDasharray="5 5"
          label={{ value: 'Média', position: 'right', fontSize: 10, fill: tickColor }}
        />
        <Bar
          dataKey="revenue"
          fill="#16a34a"
          radius={[4, 4, 0, 0]}
          isAnimationActive
          animationDuration={600}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
