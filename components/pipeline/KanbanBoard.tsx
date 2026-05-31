'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { DealCard } from './DealCard'
import { updateDealStage } from '@/app/actions/deals'
import type { DealStage, DealWithLead, Lead } from '@/types'

const STAGES: DealStage[] = [
  'new_lead',
  'contacted',
  'proposal_sent',
  'negotiation',
  'closed_won',
  'closed_lost',
]

interface KanbanBoardProps {
  deals: DealWithLead[]
  workspaceId: string
  leads: Pick<Lead, 'id' | 'name'>[]
}

export function KanbanBoard({ deals: initialDeals, workspaceId, leads }: KanbanBoardProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const draggedDeal = deals.find((d) => d.id === active.id)
    if (!draggedDeal) return

    const overStage = (over.data?.current?.stage ?? over.id) as DealStage

    if (draggedDeal.stage === overStage && active.id === over.id) return

    startTransition(() => {
      setDeals((prev) =>
        prev.map((d) => (d.id === active.id ? { ...d, stage: overStage } : d))
      )
    })

    updateDealStage(draggedDeal.id, overStage)
  }

  const dealsByStage = STAGES.reduce<Record<DealStage, DealWithLead[]>>(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage)
      return acc
    },
    {} as Record<DealStage, DealWithLead[]>
  )

  return (
    <DndContext id="kanban-dnd" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory lg:snap-none [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent] dark:[scrollbar-color:theme(colors.slate.700)_transparent]">
        {STAGES.map((stage) => (
          <div key={stage} className="snap-start snap-always flex-shrink-0">
            <KanbanColumn
              stage={stage}
              deals={dealsByStage[stage]}
              workspaceId={workspaceId}
              leads={leads}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeDeal && <DealCard deal={activeDeal} />}
      </DragOverlay>
    </DndContext>
  )
}
