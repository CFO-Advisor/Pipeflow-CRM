'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, Settings, Building2, BarChart2, CalendarDays,
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
  { href: '/vendas',    label: 'Performance',    icon: BarChart2 },
  { href: '/calendario',label: 'Calendário',     icon: CalendarDays },
  { href: '/settings',  label: 'Configurações',  icon: Settings },
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

  // pinned = sidebar fixa mesmo sem hover (persiste no localStorage)
  const [pinned, setPinned] = useState(false)
  // hovered = mouse está sobre o sidebar
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-pinned')
    if (saved !== null) setPinned(JSON.parse(saved))
  }, [])

  const isExpanded = !mounted ? false : (pinned || hovered)

  // Clique no logo "P" → toggle pin
  function togglePin() {
    setPinned((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-pinned', JSON.stringify(next))
      return next
    })
  }

  // Clique num item de nav → fixa o sidebar
  const handleNavClick = useCallback(() => {
    setPinned((prev) => {
      if (!prev) {
        localStorage.setItem('sidebar-pinned', JSON.stringify(true))
        return true
      }
      return prev
    })
  }, [])

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
          isExpanded ? 'w-64' : 'w-16',
        )}
      >
        {/* Header — clique no logo toggle o pin */}
        <div className={cn(
          'border-b border-sidebar-border transition-all duration-250',
          isExpanded ? 'p-4' : 'p-3',
        )}>
          <div className={cn(
            'flex items-center gap-2 mb-4',
            !isExpanded && 'justify-center',
          )}>
            <button
              onClick={togglePin}
              title={pinned ? 'Desafixar sidebar' : 'Fixar sidebar'}
              className={cn(
                'w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0',
                'hover:opacity-80 transition-opacity duration-150 cursor-pointer',
                // anel sutil quando pinned
                pinned && 'ring-2 ring-sidebar-primary-foreground/30',
              )}
            >
              <span className="text-sidebar-primary-foreground text-sm font-bold">P</span>
            </button>
            {isExpanded && (
              <>
                <span className="text-xl font-bold flex-1 whitespace-nowrap overflow-hidden">PipeFlow</span>
                <ThemeToggle />
              </>
            )}
          </div>

          {isExpanded ? (
            <>
              <WorkspaceSwitcher workspaces={workspaces} currentWorkspace={currentWorkspace} />
              {currentWorkspace.plan === 'max' && companies.length > 0 && (
                <div className="mt-1">
                  <CompanySwitcher companies={companies} currentCompanyId={currentCompanyId} />
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
          isExpanded ? 'p-4' : 'p-2',
        )}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={!isExpanded ? label : undefined}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors duration-150',
                  isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {isExpanded && (
                  <span className="whitespace-nowrap overflow-hidden">{label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer — UserMenu */}
        <div className={cn(
          'border-t border-sidebar-border transition-all duration-250',
          isExpanded ? 'p-4' : 'p-3 flex justify-center',
        )}>
          <UserMenu email={userEmail} name={userName} collapsed={!isExpanded} />
        </div>
      </aside>

      {/* ── Mobile sidebar ── */}
      <MobileSidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        userEmail={userEmail}
        userName={userName}
      />

      {/* ── Main content — margem acompanha o estado do sidebar ── */}
      <main
        className={cn(
          'flex-1 min-w-0 px-4 py-6 pt-16 lg:pt-0 lg:py-6 lg:pl-3 lg:pr-6',
          'bg-background text-foreground',
          'transition-all duration-250 ease-in-out',
          // No servidor (mounted=false) usa w-16 como padrão para evitar layout shift
          !mounted || !pinned ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        {children}
      </main>
    </div>
  )
}
