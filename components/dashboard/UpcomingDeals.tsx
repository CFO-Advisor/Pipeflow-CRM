import Link from 'next/link'
import { Calendar, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DealWithLead } from '@/types'

interface UpcomingDealsProps {
  deals: DealWithLead[]
}

export function UpcomingDeals({ deals }: UpcomingDealsProps) {
  if (deals.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        Nenhum negócio com prazo próximo.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => {
        const isOverdue = deal.deadline && new Date(deal.deadline) < new Date()
        return (
          <div key={deal.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{deal.title}</p>
              {deal.lead && (
                <p className="text-xs text-slate-500 truncate">{deal.lead.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {deal.value > 0 && (
                <span className="text-xs text-green-700 font-medium">
                  {formatCurrency(deal.value)}
                </span>
              )}
              {deal.deadline && (
                <Badge
                  variant="outline"
                  className={`text-xs ${isOverdue ? 'border-red-300 text-red-600' : 'border-slate-300 text-slate-500'}`}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(deal.deadline)}
                </Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
