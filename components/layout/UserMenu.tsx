'use client'

import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeftRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface UserMenuProps {
  email: string
  name?: string
  collapsed?: boolean
}

export function UserMenu({ email, name, collapsed }: UserMenuProps) {
  const router = useRouter()

  function handleLogout() {
    router.push('/api/auth/logout')
  }

  function handleSwitchUser() {
    router.push('/api/auth/logout')
  }

  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : email.slice(0, 2).toUpperCase()

  /* ── Modo recolhido: avatar com dropdown ── */
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          title={name ?? email}
          className="rounded-lg hover:bg-sidebar-accent transition-colors p-1"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" side="top">
          <DropdownMenuLabel>
            <p className="font-medium">{name ?? email}</p>
            {name && <p className="text-xs text-muted-foreground font-normal">{email}</p>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSwitchUser} className="cursor-pointer">
            <ArrowLeftRight className="w-4 h-4 mr-2 text-muted-foreground" />
            Trocar de usuário
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  /* ── Modo expandido: user info + botões ── */
  return (
    <div className="space-y-1">
      {/* Informações do usuário */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{name ?? email}</p>
          {name && <p className="text-xs text-muted-foreground truncate">{email}</p>}
        </div>
      </div>

      {/* Trocar de usuário */}
      <button
        onClick={handleSwitchUser}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-150"
      >
        <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
        Trocar de usuário
      </button>

      {/* Sair */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors duration-150"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        Sair
      </button>
    </div>
  )
}
