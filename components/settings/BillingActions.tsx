'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BillingActionsProps {
  workspaceId: string
  stripeCustomerId: string | null
  currentPlan: 'free' | 'pro' | 'max'
  /** Se fornecido, renderiza botão de upgrade para este plano específico */
  targetPlan?: 'pro' | 'max'
}

export function BillingActions({
  workspaceId,
  currentPlan,
  targetPlan,
}: BillingActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade(plan: 'pro' | 'max') {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, targetPlan: plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Erro ao iniciar checkout.')
        setLoading(false)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Erro ao abrir portal.')
        setLoading(false)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      )}

      {/* Gerenciar assinatura existente */}
      {(currentPlan === 'pro' || currentPlan === 'max') && !targetPlan && (
        <Button onClick={handlePortal} disabled={loading} variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          {loading ? 'Carregando...' : 'Gerenciar no Stripe'}
        </Button>
      )}

      {/* Botão de upgrade para Pro */}
      {targetPlan === 'pro' && currentPlan === 'free' && (
        <Button
          onClick={() => handleUpgrade('pro')}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 w-full"
        >
          {loading ? 'Carregando...' : 'Assinar Pro — R$ 49/mês'}
        </Button>
      )}

      {/* Botão de upgrade para MAX */}
      {targetPlan === 'max' && (currentPlan === 'free' || currentPlan === 'pro') && (
        <Button
          onClick={() => handleUpgrade('max')}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 w-full"
        >
          {loading ? 'Carregando...' : 'Assinar MAX — R$ 100/mês'}
        </Button>
      )}
    </div>
  )
}
