'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PanelLeftClose, PanelLeftOpen,
  LayoutDashboard, Users, Kanban, Settings, Building2, UserCheck, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { CompanySwitcher } from './CompanySwitcher'
import { UserMenu } from './UserMenu'
import { MobileSidebar } from './MobileSidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { Workspace, Company } from '@/types'

interface SidebarShellProps {
  children: React.ReactNode
  workspaces: Workspace[]
  currentWorkspace: Workspace
  companies: Company[]
  currentCompanyId: string | null
  userEmail: string
  userName?: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/leads',     label: 'Leads',          icon: Users },
  { href: '/pipeline',  label: 'Pipeline',       icon: Kanban },
  { href: '/vendas',      label: 'Representantes', icon: UserCheck },
  { href: '/calendario',  label: 'Calendário',     icon: CalendarDays },
  { href: '/settings',    label: 'Configurações',  icon: Settings },
]

export function SidebarShell({
  children,
  workspaces,
  currentWorkspace,
  companies,
  currentCompanyId,
  userEmail,
  userName,
}: SidebarShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(JSON.parse(saved))
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next))
      return next
    })
  }

  const isCollapsed = mounted ? collapsed : false

  return (
    <div className="flex w-full min-h-screen bg-background">

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col min-h-screen fixed left-0 top-0 z-40',
          'bg-sidebar text-sidebar-foreground overflow-hidden',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Header */}
        <div className={cn('border-b border-sidebar-border transition-all duration-300', isCollapsed ? 'p-3' : 'p-4')}>
          <div className={cn('flex items-center gap-2 mb-4', isCollapsed && 'justify-center')}>
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground text-sm font-bold">P</span>
            </div>
            {!isCollapsed && (
              <>
                <span className="text-xl font-bold flex-1 whitespace-nowrap">PipeFlow</span>
                <ThemeToggle />
              </>
            )}
          </div>

          {isCollapsed ? (
            <div className="flex justify-center" title={currentWorkspace.name}>
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
          ) : (
            <>
              <WorkspaceSwitcher workspaces={workspaces} currentWorkspace={currentWorkspace} />
              {currentWorkspace.plan === 'max' && companies.length > 0 && (
                <div className="mt-1">
                  <CompanySwitcher companies={companies} currentCompanyId={currentCompanyId} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 space-y-1 transition-all duration-300', isCollapsed ? 'p-2' : 'p-4')}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors duration-150',
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Toggle button */}
        <div className={cn('px-3 pb-2 flex', isCollapsed ? 'justify-center' : 'justify-end')}>
          <button
            onClick={toggle}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="p-2 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-150"
          >
            {isCollapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Footer — UserMenu */}
        <div className={cn('border-t border-sidebar-border transition-all duration-300', isCollapsed ? 'p-3 flex justify-center' : 'p-4')}>
          <UserMenu email={userEmail} name={userName} collapsed={isCollapsed} />
        </div>
      </aside>

      {/* ── Mobile sidebar ── */}
      <MobileSidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        userEmail={userEmail}
        userName={userName}
      />

      {/* ── Main content ── */}
      <main
        className={cn(
          'flex-1 min-w-0 px-4 py-6 pt-16 lg:pt-0 lg:py-6 lg:pl-3 lg:pr-6',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        {children}
      </main>
    </div>
  )
}
