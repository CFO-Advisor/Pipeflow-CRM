'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { WorkspaceMember } from '@/types'

interface MemberListProps {
  members: Array<WorkspaceMember & { email: string; name?: string }>
  currentUserId: string
  isAdmin: boolean
}

export function MemberList({ members, currentUserId, isAdmin }: MemberListProps) {
  const router = useRouter()
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [resetMember, setResetMember] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  async function handleRemoveConfirmed() {
    if (!confirmRemoveId) return
    const supabase = createClient()
    await supabase.from('workspace_members').delete().eq('id', confirmRemoveId)
    router.refresh()
  }

  function openResetDialog(member: { id: string; name?: string; email: string }) {
    setResetMember({ id: member.id, name: member.name ?? member.email })
    setNewPassword('')
    setResetError('')
  }

  async function handleResetPassword() {
    if (!resetMember) return
    if (newPassword.length < 6) {
      setResetError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setResetLoading(true)
    setResetError('')

    const res = await fetch(`/api/members/${resetMember.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    })

    const data = await res.json().catch(() => ({}))
    setResetLoading(false)

    if (!res.ok) {
      setResetError(data.error ?? 'Erro ao resetar a senha.')
    } else {
      setResetMember(null)
      setNewPassword('')
    }
  }

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
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                {member.role === 'admin' ? 'Admin' : 'Membro'}
              </Badge>
              {isAdmin && member.user_id !== currentUserId && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                    title="Resetar senha"
                    onClick={() => openResetDialog(member)}
                  >
                    <KeyRound className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => setConfirmRemoveId(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmRemoveId}
        onOpenChange={(open) => { if (!open) setConfirmRemoveId(null) }}
        title="Remover colaborador"
        description="Este colaborador perderá o acesso ao workspace."
        confirmLabel="Remover"
        onConfirm={handleRemoveConfirmed}
      />

      <Dialog open={!!resetMember} onOpenChange={(open) => { if (!open) setResetMember(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resetar senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha temporária para <strong>{resetMember?.name}</strong>. O colaborador precisará trocá-la no próximo acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reset-password">Nova senha temporária</Label>
            <Input
              id="reset-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
            {resetError && (
              <p className="text-sm text-destructive">{resetError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetMember(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {resetLoading ? 'Salvando...' : 'Resetar senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
