'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface WonLostDonutProps {
  won: number
  lost: number
}

export function WonLostDonut({ won, lost }: WonLostDonutProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const total = won + lost
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0

  const data = [
    { name: 'Ganhos', value: won, fill: '#16a34a' },
    { name: 'Perdidos', value: lost, fill: '#dc2626' },
  ]

  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b'

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-center gap-2">
        <p className="text-muted-foreground text-sm">Nenhum negócio fechado ainda.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
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
          formatter={(value: any, name: any) => [Number(value) || 0, name]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Taxa de conversão no centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-foreground">{winRate}%</span>
        <span className="text-xs text-muted-foreground">conversão</span>
      </div>

      {/* Legenda */}
      <div className="flex justify-center gap-5 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">{won} ganhos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">{lost} perdidos</span>
        </div>
      </div>
    </div>
  )
}
