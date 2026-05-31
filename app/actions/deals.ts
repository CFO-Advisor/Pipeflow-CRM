'use server'

import { createClient } from '@/lib/supabase/server'
import type { DealStage } from '@/types'

export async function updateDealStage(dealId: string, stage: DealStage) {
  const supabase = await createClient()
  await supabase
    .from('deals')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', dealId)
}
