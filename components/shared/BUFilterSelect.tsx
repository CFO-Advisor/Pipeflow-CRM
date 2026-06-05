'use client'

import { Layers3, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { BusinessUnit } from '@/types'

interface BUFilterSelectProps {
  businessUnits: BusinessUnit[]
  currentCompanyId: string | null
  currentBusinessUnitId: string | null
}

export function BUFilterSelect({ businessUnits, currentCompanyId, currentBusinessUnitId }: BUFilterSelectProps) {
  // Filtra por empresa se selecionada, senão mostra todas as BUs ativas
  const activeBUs = currentCompanyId
    ? businessUnits.filter(bu => bu.company_id === currentCompanyId && bu.active)
    : businessUnits.filter(bu => bu.active)

  if (activeBUs.length === 0) return null

  const currentBU = activeBUs.find(bu => bu.id === currentBusinessUnitId)

  function switchBU(id: string | 'all') {
    const currentPath = window.location.pathname
    window.location.href = `/api/workspace/activate-business-unit?id=${id}&next=${encodeURIComponent(currentPath)}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
        <Layers3 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="truncate max-w-[160px]">
          {currentBU ? currentBU.name : 'Todas as unidades'}
        </span>
        <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
        </svg>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Unidade de Negócio
        </p>

        <DropdownMenuItem onClick={() => switchBU('all')}>
          <Layers3 className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 truncate">Todas as unidades</span>
          {!currentBusinessUnitId && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {activeBUs.map((bu) => (
          <DropdownMenuItem key={bu.id} onClick={() => switchBU(bu.id)}>
            <span className="flex-1 truncate">{bu.name}</span>
            {bu.id === currentBusinessUnitId && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
