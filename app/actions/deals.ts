'use server'

import { createClient } from '@/lib/supabase/server'
import type { DealStage } from '@/types'

const VALID_STAGES: DealStage[] = [
  'new_lead',
  'contacted',
  'proposal_sent',
  'negotiation',
  'closed_won',
  'closed_lost',
]

export async function updateDealStage(dealId: string, stage: DealStage) {
  if (!VALID_STAGES.includes(stage)) throw new Error('Stage inválido')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  await supabase
    .from('deals')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', dealId)
}
