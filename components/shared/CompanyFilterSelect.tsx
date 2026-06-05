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

interface CompanyFilterSelectProps {
  companies: Company[]
  currentCompanyId: string | null
}

export function CompanyFilterSelect({ companies, currentCompanyId }: CompanyFilterSelectProps) {
  const activeCompanies = companies.filter((c) => c.active)
  const current = activeCompanies.find((c) => c.id === currentCompanyId)

  if (activeCompanies.length === 0) return null

  function switchCompany(id: string | 'all') {
    const currentPath = window.location.pathname
    window.location.href = `/api/workspace/activate-company?id=${id}&next=${encodeURIComponent(currentPath)}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
        <Building className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="truncate max-w-[160px]">
          {current ? current.name : 'Todas as empresas'}
        </span>
        <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
        </svg>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
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
          <DropdownMenuItem key={company.id} onClick={() => switchCompany(company.id)}>
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 truncate">{company.name}</span>
            {company.id === currentCompanyId && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
