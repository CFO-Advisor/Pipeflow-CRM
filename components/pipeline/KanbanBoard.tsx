'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { DealCard } from './DealCard'
import { updateDealStage } from '@/app/actions/deals'
import { STAGE_ORDER as STAGES } from '@/lib/deal-stages'
import type { BusinessUnit, DealStage, DealWithLead, Lead } from '@/types'

interface KanbanBoardProps {
  deals: DealWithLead[]
  workspaceId: string
  leads: Pick<Lead, 'id' | 'name'>[]
  companyId?: string | null
  businessUnits?: BusinessUnit[]
}

export function KanbanBoard({ deals: initialDeals, workspaceId, leads, companyId, businessUnits = [] }: KanbanBoardProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Sincroniza apenas quando o servidor retorna novos dados (nova referência de initialDeals)
  // Não inclui activeId para não reverter a coluna após cada drag
  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

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

    // Atualização otimista
    setDeals((prev) =>
      prev.map((d) => (d.id === active.id ? { ...d, stage: overStage } : d))
    )

    try {
      await updateDealStage(draggedDeal.id, overStage)
    } catch {
      // Rollback em caso de erro
      setDeals((prev) =>
        prev.map((d) => (d.id === active.id ? { ...d, stage: draggedDeal.stage } : d))
      )
    }
  }

  const dealsByStage = useMemo(
    () => STAGES.reduce<Record<DealStage, DealWithLead[]>>(
      (acc, stage) => {
        acc[stage] = deals.filter((d) => d.stage === stage)
        return acc
      },
      {} as Record<DealStage, DealWithLead[]>
    ),
    [deals]
  )

  return (
    <DndContext
      id="kanban-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-3 sm:overflow-x-auto sm:pb-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent] dark:[scrollbar-color:theme(colors.slate.700)_transparent]">
        {STAGES.map((stage) => (
          <div key={stage} className="sm:flex-shrink-0">
            <KanbanColumn
              stage={stage}
              deals={dealsByStage[stage]}
              workspaceId={workspaceId}
              leads={leads}
              companyId={companyId}
              businessUnits={businessUnits}
              showCompany={!companyId}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDeal && <DealCard deal={activeDeal} showCompany={!companyId} />}
      </DragOverlay>
    </DndContext>
  )
}
