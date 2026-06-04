import type { DealStage } from '@/types'

export const STAGE_ORDER: DealStage[] = [
  'new_lead',
  'contacted',
  'proposal_sent',
  'negotiation',
  'closed_won',
  'closed_lost',
]

export const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: 'Novo Lead',
  contacted: 'Contato Realizado',
  proposal_sent: 'Proposta Enviada',
  negotiation: 'Negociação',
  closed_won: 'Fechado Ganho',
  closed_lost: 'Fechado Perdido',
}
