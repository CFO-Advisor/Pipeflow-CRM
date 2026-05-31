'use client'

import { useState, useOptimistic, useTransition } from 'react'
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

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const draggedDeal = deals.find((d) => d.id === active.id)
    if (!draggedDeal) return

    const overStage = (over.data?.current?.stage ?? over.id) as DealStage

    if (draggedDeal.stage === overStage && active.id === over.id) return

    const newDeals = deals.map((d) =>
      d.id === active.id ? { ...d, stage: overStage } : d
    )
    setDeals(newDeals)

    startTransition(async () => {
      await updateDealStage(draggedDeal.id, overStage)
    })
  }

  const dealsByStage = STAGES.reduce<Record<DealStage, DealWithLead[]>>(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage)
      return acc
    },
    {} as Record<DealStage, DealWithLead[]>
  )

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={dealsByStage[stage]}
            workspaceId={workspaceId}
            leads={leads}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && <DealCard deal={activeDeal} />}
      </DragOverlay>
    </DndContext>
  )
}
