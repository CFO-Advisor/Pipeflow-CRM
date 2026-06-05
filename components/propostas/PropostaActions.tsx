'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Send, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Proposal } from '@/types'

interface PropostaActionsProps {
  proposal: Proposal
  publicLink: string
}

export function PropostaActions({ proposal, publicLink }: PropostaActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function markAsSent() {
    await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    })
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Baixar PDF original */}
          <a href={`/api/proposals/${proposal.id}/pdf`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" />
              Baixar PDF
            </Button>
          </a>

          {/* Copiar link do cliente */}
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied
              ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" />
              : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? 'Link copiado!' : 'Link do cliente'}
          </Button>

          {/* Marcar como enviada */}
          {proposal.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={markAsSent} className="text-blue-600 border-blue-300">
              <Send className="w-4 h-4 mr-1.5" />
              Marcar como enviada
            </Button>
          )}

          {/* Visualizar como cliente */}
          <a href={publicLink} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Visualizar como cliente →
            </Button>
          </a>
        </div>

        {proposal.status !== 'signed' && (
          <p className="text-xs text-muted-foreground">
            Link do cliente:{' '}
            <span className="font-mono text-foreground break-all">{publicLink}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
