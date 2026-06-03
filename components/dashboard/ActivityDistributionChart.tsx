'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface ActivityTypeCount {
  type: string
  count: number
}

const ACTIVITY_COLORS: Record<string, string> = {
  call: '#3b82f6',
  email: '#a855f7',
  meeting: '#f97316',
  note: '#94a3b8',
  proposal: '#16a34a',
}

const ACTIVITY_LABELS: Record<string, string> = {
  call: 'Ligação',
  email: 'E-mail',
  meeting: 'Reunião',
  note: 'Nota',
  proposal: 'Proposta',
}

interface ActivityDistributionChartProps {
  data: ActivityTypeCount[]
}

export function ActivityDistributionChart({ data }: ActivityDistributionChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b'

  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Nenhuma atividade registrada no período.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: ACTIVITY_LABELS[d.type] ?? d.type,
    fill: ACTIVITY_COLORS[d.type] ?? '#94a3b8',
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius={70}
          strokeWidth={0}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Pie>
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
          formatter={(value: any, name: any) => {
            const num = Number(value) || 0
            const pct = total > 0 ? Math.round((num / total) * 100) : 0
            return [`${num} (${pct}%)`, name]
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          iconType="circle"
          iconSize={8}
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
