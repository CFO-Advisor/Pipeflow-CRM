'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, Settings, Building2, BarChart2, CalendarDays, Menu, FileText, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { CompanySwitcher } from './CompanySwitcher'
import { BusinessUnitSwitcher } from './BusinessUnitSwitcher'
import { UserMenu } from './UserMenu'
import { MobileSidebar } from './MobileSidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { Workspace, Company, BusinessUnit } from '@/types'

interface SidebarShellProps {
  children: React.ReactNode
  workspaces: Workspace[]
  currentWorkspace: Workspace
  companies: Company[]
  businessUnits: BusinessUnit[]
  currentCompanyId: string | null
  currentBusinessUnitId: string | null
  userEmail: string
  userName?: string
}

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/leads',      label: 'Leads',        icon: Users },
  { href: '/pipeline',   label: 'Pipeline',     icon: Kanban },
  { href: '/vendas',     label: 'Performance',  icon: BarChart2 },
  { href: '/propostas',  label: 'Propostas',    icon: FileText },
  { href: '/metas',      label: 'Metas',        icon: Target },
  { href: '/calendario', label: 'Calendário',   icon: CalendarDays },
  { href: '/settings',   label: 'Configurações',icon: Settings },
]

export function SidebarShell({
  children,
  workspaces,
  currentWorkspace,
  companies,
  businessUnits,
  currentCompanyId,
  currentBusinessUnitId,
  userEmail,
  userName,
}: SidebarShellProps) {
  const pathname = usePathname()
  const [hovered, setHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex w-full min-h-screen bg-background">

      {/* ── Desktop sidebar ── */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'hidden lg:flex flex-col min-h-screen fixed left-0 top-0 z-40',
          'bg-sidebar text-sidebar-foreground overflow-hidden',
          'transition-all duration-250 ease-in-out',
          hovered ? 'w-64' : 'w-16',
        )}
      >
        {/* Header */}
        <div className={cn(
          'border-b border-sidebar-border transition-all duration-250',
          hovered ? 'p-4' : 'p-3',
        )}>
          <div className={cn(
            'flex items-center gap-2 mb-4',
            !hovered && 'justify-center',
          )}>
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground text-sm font-bold">P</span>
            </div>
            {hovered && (
              <>
                <span className="text-xl font-bold flex-1 whitespace-nowrap overflow-hidden">PipeFlow</span>
                <ThemeToggle />
              </>
            )}
          </div>

          {hovered ? (
            <>
              <WorkspaceSwitcher workspaces={workspaces} currentWorkspace={currentWorkspace} />
              {companies.length > 0 && (
                <div className="mt-1">
                  <CompanySwitcher companies={companies} currentCompanyId={currentCompanyId} />
                </div>
              )}
              {currentCompanyId && businessUnits.filter(bu => bu.company_id === currentCompanyId && bu.active).length > 0 && (
                <div className="mt-1">
                  <BusinessUnitSwitcher
                    companies={companies}
                    businessUnits={businessUnits}
                    currentCompanyId={currentCompanyId}
                    currentBusinessUnitId={currentBusinessUnitId}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center" title={currentWorkspace.name}>
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={cn(
          'flex-1 space-y-1 transition-all duration-250',
          hovered ? 'p-4' : 'p-2',
        )}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={!hovered ? label : undefined}
                onClick={() => setHovered(false)}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors duration-150',
                  hovered ? 'gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {hovered && (
                  <span className="whitespace-nowrap overflow-hidden">{label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer — UserMenu */}
        <div className={cn(
          'border-t border-sidebar-border transition-all duration-250',
          hovered ? 'p-4' : 'p-3 flex justify-center',
        )}>
          <UserMenu email={userEmail} name={userName} collapsed={!hovered} />
        </div>
      </aside>

      {/* ── Mobile sidebar (drawer) ── */}
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        userEmail={userEmail}
        userName={userName}
      />

      {/* ── Content column (mobile top bar + page) ── */}
      <div className="flex-1 min-w-0 flex flex-col lg:ml-16">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sidebar-primary rounded flex items-center justify-center">
              <span className="text-sidebar-primary-foreground text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-sm">PipeFlow</span>
          </div>
        </header>

        {/* ── Main content ── */}
        <main
          className={cn(
            'flex-1 min-w-0 px-4 py-6 lg:py-6 lg:pl-3 lg:pr-6',
            'bg-background text-foreground',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
