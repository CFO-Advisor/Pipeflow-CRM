'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BillingActionsProps {
  workspaceId: string
  stripeCustomerId: string | null
  isPro: boolean
}

export function BillingActions({ workspaceId, stripeCustomerId, isPro }: BillingActionsProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  async function handlePortal() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  if (isPro) {
    return (
      <Button onClick={handlePortal} disabled={loading} variant="outline">
        <ExternalLink className="w-4 h-4 mr-2" />
        {loading ? 'Carregando...' : 'Gerenciar no Stripe'}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {loading ? 'Carregando...' : 'Assinar Pro — R$49/mês'}
    </Button>
  )
}
