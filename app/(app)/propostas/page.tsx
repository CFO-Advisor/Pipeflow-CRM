import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PropostasClient } from '@/components/propostas/PropostasClient'
import type { Company, Proposal } from '@/types'

export default async function PropostasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const companyId = cookieStore.get('current_company_id')?.value ?? null

  const service = createServiceClient()
  const [{ data: proposals }, { data: companiesData }] = await Promise.all([
    service
      .from('proposals')
      .select('*, items:proposal_items(*), lead:leads(name, company), deal:deals(lead:leads(name, company))')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(100),
    service
      .from('companies')
      .select('id, name, cnpj, logo_url, active, workspace_id, created_at')
      .eq('workspace_id', workspaceId)
      .order('name'),
  ])

  const companies = (companiesData ?? []) as Company[]

  const proposalsWithLead = (proposals ?? []).map(p => {
    const directLead = Array.isArray(p.lead) ? p.lead[0] : p.lead
    const dealObj = Array.isArray(p.deal) ? p.deal[0] : p.deal
    const dealLead = Array.isArray(dealObj?.lead) ? dealObj.lead[0] : dealObj?.lead
    const lead = directLead ?? dealLead
    return { ...p, leadCompany: lead?.company ?? null, leadName: lead?.name ?? null }
  })

  return (
    <PropostasClient
      proposals={proposalsWithLead as (Proposal & { leadCompany: string | null; leadName: string | null })[]}
      companies={companies}
      currentCompanyId={companyId}
    />
  )
}
