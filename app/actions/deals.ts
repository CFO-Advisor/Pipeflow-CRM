'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
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

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) throw new Error('Workspace não encontrado')

  const { error } = await supabase
    .from('deals')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', dealId)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(error.message)
}
