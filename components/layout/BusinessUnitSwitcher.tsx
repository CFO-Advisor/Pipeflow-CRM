'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import type { BusinessUnit, Company } from '@/types'

interface BusinessUnitSwitcherProps {
  companies: Company[]
  businessUnits: BusinessUnit[]
  currentCompanyId: string | null
  currentBusinessUnitId: string | null
}

export function BusinessUnitSwitcher({
  companies,
  businessUnits,
  currentCompanyId,
  currentBusinessUnitId,
}: BusinessUnitSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentCompanyId) {
    return null
  }

  const currentBU = businessUnits.find((bu) => bu.id === currentBusinessUnitId)
  const activeBUs = businessUnits.filter(
    (bu) => bu.company_id === currentCompanyId && bu.active
  )

  if (activeBUs.length === 0) {
    return null
  }

  const switchBusinessUnit = (id: string | null) => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
    const params = new URLSearchParams()
    if (id) params.set('id', id)
    else params.set('id', 'all')
    params.set('next', currentPath)

    router.push(`/api/workspace/activate-business-unit?${params.toString()}`)
    setIsOpen(false)
  }

  return (
    <div className="px-2 py-1.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
      >
        <span className="truncate">
          {currentBU?.name ?? 'Todas as unidades'}
        </span>
        <ChevronDown className="ml-2 w-4 h-4 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="mt-1 rounded-md border border-border bg-background shadow-md">
          <button
            onClick={() => switchBusinessUnit(null)}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              !currentBusinessUnitId
                ? 'bg-accent font-medium'
                : 'hover:bg-accent'
            }`}
          >
            Todas as unidades
          </button>

          {activeBUs.map((bu) => (
            <button
              key={bu.id}
              onClick={() => switchBusinessUnit(bu.id)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-border ${
                currentBusinessUnitId === bu.id
                  ? 'bg-accent font-medium'
                  : 'hover:bg-accent'
              }`}
            >
              {bu.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
