'use client'

import { Badge } from '@/components/ui/badge'
import type { ProposalStatus } from '@/types'

const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string }> = {
  draft:               { label: 'Rascunho',             className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  sent:                { label: 'Enviada',               className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  awaiting_signature:  { label: 'Aguard. Assinatura',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  signed:              { label: 'Assinada',              className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  rejected:            { label: 'Recusada',              className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  expired:             { label: 'Expirada',              className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
}

export function PropostaStatusBadge({ status }: { status: ProposalStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}
