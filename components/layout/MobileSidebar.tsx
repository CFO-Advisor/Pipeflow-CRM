'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Building2 } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { Workspace } from '@/types'

interface MobileSidebarProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace
  userEmail: string
  userName?: string
}

export function MobileSidebar({
  workspaces,
  currentWorkspace,
  userEmail,
  userName,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  // Close on route change (navigation closes the drawer)
  useEffect(() => {
    const handleRouteChange = () => setOpen(false)
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-sidebar text-sidebar-foreground rounded-lg flex items-center justify-center shadow-md"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[min(288px,85vw)] bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sidebar-primary-foreground text-sm font-bold">P</span>
              </div>
              <span className="text-xl font-bold">PipeFlow</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-sidebar-foreground transition-colors p-1 rounded"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
          />
        </div>

        <div className="flex-1 p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <Sidebar />
        </div>

        <div className="p-4 border-t border-sidebar-border flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <UserMenu email={userEmail} name={userName} />
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}
