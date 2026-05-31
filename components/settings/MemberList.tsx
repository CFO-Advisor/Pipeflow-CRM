'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { WorkspaceMember } from '@/types'

interface MemberListProps {
  members: Array<WorkspaceMember & { email: string; name?: string }>
  currentUserId: string
  isAdmin: boolean
}

export function MemberList({ members, currentUserId, isAdmin }: MemberListProps) {
  const router = useRouter()

  async function handleRemove(memberId: string) {
    if (!confirm('Remover este colaborador?')) return
    const supabase = createClient()
    await supabase.from('workspace_members').delete().eq('id', memberId)
    router.refresh()
  }

  return (
    <div className="divide-y divide-slate-100">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 text-sm font-semibold">
                {(member.name ?? member.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{member.name ?? member.email}</p>
              {member.name && <p className="text-xs text-slate-500">{member.email}</p>}
              {!member.user_id && member.invited_email && (
                <p className="text-xs text-amber-600">Convite pendente</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={member.role === 'admin' ? 'default' : 'outline'}
              className={member.role === 'admin' ? 'bg-blue-600' : ''}
            >
              {member.role === 'admin' ? 'Admin' : 'Membro'}
            </Badge>
            {isAdmin && member.user_id !== currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-slate-400 hover:text-red-600"
                onClick={() => handleRemove(member.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
