'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteActivity } from '@/app/actions/activities'

interface DeleteActivityButtonProps {
  activityId: string
  leadId: string
}

export function DeleteActivityButton({ activityId, leadId }: DeleteActivityButtonProps) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
      return
    }
    setLoading(true)
    try {
      await deleteActivity(activityId, leadId)
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (loading) {
    return <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
        confirm
          ? 'text-destructive font-medium hover:bg-destructive/10'
          : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive'
      }`}
      title={confirm ? 'Clique para confirmar exclusão' : 'Excluir atividade'}
    >
      {confirm ? 'Confirmar?' : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}
