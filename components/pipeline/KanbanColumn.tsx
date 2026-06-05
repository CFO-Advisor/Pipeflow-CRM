'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DealCard } from './DealCard'
import { DealForm } from './DealForm'
import { STAGE_LABELS } from '@/lib/deal-stages'
import type { BusinessUnit, DealStage, DealWithLead, Lead } from '@/types'

const stageColors: Record<DealStage, { headerColor: string; bgColor: string }> = {
  new_lead: { headerColor: 'bg-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-950/30' },
  contacted: { headerColor: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  proposal_sent: { headerColor: 'bg-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30' },
  negotiation: { headerColor: 'bg-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  closed_won: { headerColor: 'bg-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  closed_lost: { headerColor: 'bg-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30' },
}

interface KanbanColumnProps {
  stage: DealStage
  deals: DealWithLead[]
  workspaceId: string
  leads: Pick<Lead, 'id' | 'name'>[]
  companyId?: string | null
  businessUnits?: BusinessUnit[]
  showCompany?: boolean
}

export function KanbanColumn({ stage, deals, workspaceId, leads, companyId, businessUnits, showCompany }: KanbanColumnProps) {
  const [showForm, setShowForm] = useState(false)
  const colors = stageColors[stage]
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="w-full sm:w-72 rounded-xl shadow-sm overflow-hidden">
      <div className={`${colors.headerColor} px-3 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white tracking-tight">{STAGE_LABELS[stage]}</span>
          <span className="bg-white/25 text-white text-xs font-medium rounded-full px-2 py-0.5 tabular-nums">
            {deals.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-white hover:bg-white/20 transition-colors duration-150"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-[80px] sm:min-h-[300px] lg:min-h-[400px] p-2 space-y-2 transition-colors duration-150 ${
            isOver ? 'bg-blue-100 dark:bg-blue-900/30' : colors.bgColor
          }`}
        >
          {deals.length === 0 && !isOver && (
            <div className="flex items-center justify-center h-24 mt-4">
              <p className="text-xs text-muted-foreground/50 text-center px-2">
                Arraste cards aqui
              </p>
            </div>
          )}
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} showCompany={showCompany} />
          ))}
        </div>
      </SortableContext>

      <DealForm
        open={showForm}
        onOpenChange={setShowForm}
        workspaceId={workspaceId}
        defaultStage={stage}
        leads={leads}
        companyId={companyId}
        businessUnits={businessUnits}
      />
    </div>
  )
}
