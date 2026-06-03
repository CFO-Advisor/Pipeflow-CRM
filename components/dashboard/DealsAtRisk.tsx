import Link from 'next/link'
import { AlertTriangle, Clock, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RiskyDeal {
  id: string
  title: string
  value: number
  stage: string
  deadline: string | null
  daysSinceActivity: number | null
  daysUntilDeadline: number | null
  leadName: string
  repName: string | null
}

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'Novo',
  contacted: 'Contato',
  proposal_sent: 'Proposta',
  negotiation: 'Negociação',
}

interface DealsAtRiskProps {
  deals: RiskyDeal[]
}

export function DealsAtRisk({ deals }: DealsAtRiskProps) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <p className="text-muted-foreground text-sm">Nenhum negócio em risco no momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deals.map((deal) => {
        const isDeadlineRisk = deal.daysUntilDeadline !== null && deal.daysUntilDeadline <= 7
        const isStaleRisk = deal.daysSinceActivity !== null && deal.daysSinceActivity >= 14

        return (
          <Link
            key={deal.id}
            href={`/pipeline`}
            className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors group"
          >
            <div className="mt-0.5 flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-600 transition-colors">
                  {deal.title}
                </p>
                {deal.value > 0 && (
                  <span className="text-xs font-medium text-green-700 dark:text-green-400 flex-shrink-0">
                    {formatCurrency(deal.value)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {deal.leadName}
                {deal.repName && ` · ${deal.repName}`}
                {' · '}{STAGE_LABELS[deal.stage] ?? deal.stage}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {isStaleRisk && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3" />
                    {deal.daysSinceActivity}d sem atividade
                  </span>
                )}
                {isDeadlineRisk && deal.daysUntilDeadline !== null && (
                  <span className={`flex items-center gap-1 text-xs ${deal.daysUntilDeadline <= 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-orange-600 dark:text-orange-400'}`}>
                    <Calendar className="w-3 h-3" />
                    {deal.daysUntilDeadline <= 0
                      ? `Vencido há ${Math.abs(deal.daysUntilDeadline)}d`
                      : `Vence em ${deal.daysUntilDeadline}d`}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
