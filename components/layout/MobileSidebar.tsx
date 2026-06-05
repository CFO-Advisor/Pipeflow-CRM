'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { Workspace } from '@/types'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  workspaces: Workspace[]
  currentWorkspace: Workspace
  userEmail: string
  userName?: string
}

export function MobileSidebar({
  open,
  onClose,
  workspaces,
  currentWorkspace,
  userEmail,
  userName,
}: MobileSidebarProps) {
  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[min(288px,85vw)] bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground text-sm font-bold">S</span>
            </div>
            <span className="text-xl font-bold flex-1">Sales Flow</span>
            <ThemeToggle />
            <button
              onClick={onClose}
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

        <div className="flex-1 p-4 overflow-y-auto" onClick={onClose}>
          <Sidebar />
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <UserMenu email={userEmail} name={userName} />
        </div>
      </aside>
    </>
  )
}
