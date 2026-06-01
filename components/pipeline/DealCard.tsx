'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar, DollarSign, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DealStage, DealWithLead } from '@/types'

// Borda lateral que indica a "temperatura" do negócio — mais quente = mais próximo de fechar
const stageAccent: Record<DealStage, string> = {
  new_lead: 'border-l-blue-400',
  contacted: 'border-l-cyan-500',
  proposal_sent: 'border-l-violet-500',
  negotiation: 'border-l-amber-500',
  closed_won: 'border-l-green-500',
  closed_lost: 'border-l-red-400',
}

interface DealCardProps {
  deal: DealWithLead
}

export function DealCard({ deal }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { stage: deal.stage },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    // 'none' sobrescreve transition-all da classe CSS durante o drag; undefined deixaria a classe CSS assumir com delay
    transition: isDragging ? 'none' : (transition ?? 'transform 150ms ease'),
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue = deal.deadline && new Date(deal.deadline) < new Date()
  const accent = stageAccent[deal.stage]

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default bg-card border-l-4 ${accent}`}>
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors duration-150"
            aria-label="Arrastar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">{deal.title}</p>
            {deal.lead && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                <User className="w-3 h-3 inline mr-1" />
                {deal.lead.name}
                {deal.lead.company && ` · ${deal.lead.company}`}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {deal.value > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(deal.value)}
                </span>
              )}
              {deal.deadline && (
                <span
                  className={`flex items-center gap-1 text-xs ${
                    isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {formatDate(deal.deadline)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
