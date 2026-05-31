'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DealCard } from './DealCard'
import { DealForm } from './DealForm'
import type { DealStage, DealWithLead, Lead } from '@/types'

const stageConfig: Record<DealStage, { label: string; headerColor: string; bgColor: string }> = {
  new_lead: { label: 'Novo Lead', headerColor: 'bg-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  contacted: { label: 'Contato Realizado', headerColor: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  proposal_sent: { label: 'Proposta Enviada', headerColor: 'bg-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30' },
  negotiation: { label: 'Negociação', headerColor: 'bg-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  closed_won: { label: 'Fechado Ganho', headerColor: 'bg-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  closed_lost: { label: 'Fechado Perdido', headerColor: 'bg-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30' },
}

interface KanbanColumnProps {
  stage: DealStage
  deals: DealWithLead[]
  workspaceId: string
  leads: Pick<Lead, 'id' | 'name'>[]
}

export function KanbanColumn({ stage, deals, workspaceId, leads }: KanbanColumnProps) {
  const [showForm, setShowForm] = useState(false)
  const config = stageConfig[stage]
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`rounded-t-lg ${config.headerColor} px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{config.label}</span>
          <span className="bg-white/20 text-white text-xs rounded-full px-1.5 py-0.5">
            {deals.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-white hover:bg-white/20"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-[400px] rounded-b-lg p-2 space-y-2 transition-colors ${
            isOver ? 'bg-blue-100 dark:bg-blue-900/30' : config.bgColor
          }`}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </SortableContext>

      <DealForm
        open={showForm}
        onOpenChange={setShowForm}
        workspaceId={workspaceId}
        defaultStage={stage}
        leads={leads}
      />
    </div>
  )
}
