'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UserRoleConfig } from './UserRoleConfig'
import type { Company, SalesRole } from '@/types'
import { SALES_ROLE_LABELS } from '@/types'

type MaxMember = {
  id: string
  user_id: string | null
  role: string
  sales_role: SalesRole
  manager_id: string | null
  invited_email: string | null
  email: string
  name?: string
  company_access?: Array<{ company_id: string }>
  permissions?: Array<{ resource: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean; data_scope: string }>
  workspace_id: string
  joined_at: string
}

interface MaxMemberListProps {
  members: MaxMember[]
  companies: Company[]
  currentUserId: string
  canManageRoles: boolean
}

const ROLE_BADGE_STYLES: Record<SalesRole, string> = {
  master: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  director: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  manager: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  seller: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function MaxMemberList({ members, companies, currentUserId, canManageRoles }: MaxMemberListProps) {
  const router = useRouter()
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemoveConfirmed() {
    if (!confirmRemoveId) return
    setRemovingId(confirmRemoveId)
    await fetch(`/api/members/${confirmRemoveId}`, { method: 'DELETE' })
    setRemovingId(null)
    setConfirmRemoveId(null)
    router.refresh()
  }

  const memberToRemove = members.find(m => m.id === confirmRemoveId)

  return (
    <>
      <div className="divide-y divide-border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
                  {(member.name ?? member.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.name ?? member.email}</p>
                {member.name && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
                {!member.user_id && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Convite pendente</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_STYLES[member.sales_role as SalesRole] ?? ''}`}
              >
                {SALES_ROLE_LABELS[member.sales_role as SalesRole] ?? member.sales_role}
              </span>
              {canManageRoles && member.user_id !== currentUserId && (
                <UserRoleConfig
                  member={member as Parameters<typeof UserRoleConfig>[0]['member']}
                  companies={companies}
                  allMembers={members as Parameters<typeof UserRoleConfig>[0]['allMembers']}
                  currentUserId={currentUserId}
                />
              )}
              {canManageRoles && member.user_id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                  title={member.user_id ? 'Remover membro' : 'Cancelar convite'}
                  disabled={removingId === member.id}
                  onClick={() => setConfirmRemoveId(member.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmRemoveId}
        onOpenChange={(open) => { if (!open) setConfirmRemoveId(null) }}
        title={memberToRemove?.user_id ? 'Remover colaborador' : 'Cancelar convite'}
        description={
          memberToRemove?.user_id
            ? `${memberToRemove?.name ?? memberToRemove?.email} perderá o acesso ao workspace.`
            : `O convite enviado para ${memberToRemove?.email} será cancelado.`
        }
        confirmLabel="Remover"
        onConfirm={handleRemoveConfirmed}
      />
    </>
  )
}
