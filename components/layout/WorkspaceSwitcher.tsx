'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Building2, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Workspace } from '@/types'

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace
}

export function WorkspaceSwitcher({ workspaces, currentWorkspace }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-slate-100 hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span className="truncate text-sm">{currentWorkspace.name}</span>
        </div>
        <ChevronsUpDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 ml-2" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => {
              document.cookie = `current_workspace_id=${ws.id}; path=/`
              router.refresh()
              setOpen(false)
            }}
            className="cursor-pointer"
          >
            <Building2 className="w-4 h-4 mr-2 text-slate-400" />
            <span className="truncate">{ws.name}</span>
            {ws.id === currentWorkspace.id && (
              <span className="ml-auto text-xs text-blue-600 font-medium">Ativo</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/register')}
          className="cursor-pointer text-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
