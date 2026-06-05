'use client'

import { Building, Check, Layers } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Company } from '@/types'

interface CompanySwitcherProps {
  companies: Company[]
  currentCompanyId: string | null
}

export function CompanySwitcher({ companies, currentCompanyId }: CompanySwitcherProps) {
  const activeCompanies = companies.filter((c) => c.active)
  const current = activeCompanies.find((c) => c.id === currentCompanyId)

  if (activeCompanies.length === 0) return null

  function switchCompany(id: string | 'all') {
    const currentPath = window.location.pathname
    window.location.href = `/api/workspace/activate-company?id=${id}&next=${encodeURIComponent(currentPath)}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          {current?.logo_url ? (
            <img
              src={current.logo_url}
              alt={current.name}
              className="w-3.5 h-3.5 rounded-sm object-contain flex-shrink-0"
            />
          ) : (
            <Building className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span className="truncate text-xs">
            {current ? current.name : 'Todas as empresas'}
          </span>
        </div>
        <svg className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
        </svg>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Empresa
        </p>

        <DropdownMenuItem onClick={() => switchCompany('all')}>
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 truncate">Todas as empresas</span>
          {!currentCompanyId && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {activeCompanies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
          >
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
              />
            ) : (
              <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="flex-1 truncate">{company.name}</span>
            {company.id === currentCompanyId && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
