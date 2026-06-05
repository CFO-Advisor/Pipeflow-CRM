'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProposalStatus } from '@/types'

interface PropostaPublicActionsProps {
  token: string
  status: ProposalStatus
}

export function PropostaPublicActions({ token, status }: PropostaPublicActionsProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [done, setDone] = useState<'signed' | 'rejected' | null>(null)
  const [error, setError] = useState('')

  if (status === 'signed') {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle2 className="w-5 h-5" />
        Proposta aceita e assinada.
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
        <XCircle className="w-5 h-5" />
        Proposta recusada.
      </div>
    )
  }

  if (done === 'signed') {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle2 className="w-5 h-5" />
        Proposta aceita! O emissor foi notificado.
      </div>
    )
  }

  if (done === 'rejected') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <XCircle className="w-5 h-5 text-red-500" />
        Proposta recusada. Obrigado pelo retorno.
      </div>
    )
  }

  async function handleAction(action: 'accept' | 'reject') {
    setLoading(action)
    setError('')

    const res = await fetch(`/api/proposals/public/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    const data = await res.json()
    setLoading(null)

    if (!res.ok) {
      setError(data.error || 'Erro ao processar.')
      return
    }

    setDone(data.status)
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button
          onClick={() => handleAction('accept')}
          disabled={!!loading}
          className="bg-green-600 hover:bg-green-700 flex-1"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          {loading === 'accept' ? 'Processando...' : 'Aceitar proposta'}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction('reject')}
          disabled={!!loading}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          {loading === 'reject' ? 'Processando...' : 'Recusar'}
        </Button>
      </div>
    </div>
  )
}
