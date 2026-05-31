'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar, DollarSign, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DealWithLead } from '@/types'

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
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue = deal.deadline && new Date(deal.deadline) < new Date()

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-default bg-white">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
            aria-label="Arrastar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 leading-snug">{deal.title}</p>
            {deal.lead && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                <User className="w-3 h-3 inline mr-1" />
                {deal.lead.name}
                {deal.lead.company && ` · ${deal.lead.company}`}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {deal.value > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(deal.value)}
                </span>
              )}
              {deal.deadline && (
                <span
                  className={`flex items-center gap-1 text-xs ${
                    isOverdue ? 'text-red-600 font-medium' : 'text-slate-400'
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
