import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  description?: string
  delta?: number
  deltaLabel?: string
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-100',
  description,
  delta,
  deltaLabel,
}: MetricCardProps) {
  const showDelta = delta !== undefined
  const d = delta ?? 0

  const DeltaIcon = d === 0 ? Minus : d > 0 ? TrendingUp : TrendingDown
  const deltaColor =
    d === 0
      ? 'text-muted-foreground'
      : d > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-500 dark:text-red-400'
  const deltaText = d === 0 ? '0%' : `${d > 0 ? '+' : ''}${d.toFixed(0)}%`

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md border-border/60">
      {/* Mobile: vertical centrado */}
      <CardContent className="p-4 sm:hidden flex flex-col items-center text-center gap-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
        <p className="text-xl font-bold text-foreground leading-none tracking-tight break-words">{value}</p>
        {showDelta && (
          <div className={`flex items-center justify-center gap-1 ${deltaColor}`}>
            <DeltaIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{deltaText}</span>
          </div>
        )}
      </CardContent>

      {/* Desktop: horizontal */}
      <CardContent className="p-6 hidden sm:block">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-2 break-words leading-none tracking-tight">{value}</p>
            {showDelta && (
              <div className={`flex items-center gap-1 mt-1.5 ${deltaColor}`}>
                <DeltaIcon className="w-3 h-3" />
                <span className="text-xs font-medium">{deltaText}</span>
                {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
              </div>
            )}
            {!showDelta && description && (
              <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
