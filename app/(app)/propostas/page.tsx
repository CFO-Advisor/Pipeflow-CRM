import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PropostasClient } from '@/components/propostas/PropostasClient'
import type { Proposal } from '@/types'

export default async function PropostasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const service = createServiceClient()
  const { data: proposals } = await service
    .from('proposals')
    .select('*, items:proposal_items(*), lead:leads(name, company)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  const proposalsWithLead = (proposals ?? []).map(p => {
    const lead = Array.isArray(p.lead) ? p.lead[0] : p.lead
    return { ...p, leadCompany: lead?.company ?? null, leadName: lead?.name ?? null }
  })

  return <PropostasClient proposals={proposalsWithLead as (Proposal & { leadCompany: string | null; leadName: string | null })[]} />
}
