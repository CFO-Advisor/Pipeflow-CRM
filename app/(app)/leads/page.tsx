import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { LeadsClient } from '@/components/leads/LeadsClient'
import type { Company, BusinessUnit } from '@/types'

export default async function LeadsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  // Usa o client com RLS para garantir que o usuário é membro do workspace do cookie
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  if (!workspace) redirect('/dashboard')

  const isMax = workspace.plan === 'max'
  const service = createServiceClient()

  // Empresas e unidades de negócio para todos os planos
  const [{ data: companiesData }, { data: businessUnitsData }] = await Promise.all([
    service.from('companies').select('*').eq('workspace_id', workspaceId).eq('active', true).order('name'),
    service.from('business_units').select('*').eq('workspace_id', workspaceId).eq('active', true).order('name'),
  ])
  const companies = (companiesData ?? []) as Company[]
  const businessUnits = (businessUnitsData ?? []) as BusinessUnit[]

  // Filtro de empresa ativo no sidebar (somente plano MAX)
  const currentCompanyId = isMax
    ? (cookieStore.get('current_company_id')?.value ?? null)
    : null

  let query = service
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (currentCompanyId) {
    query = query.eq('company_id', currentCompanyId)
  }

  const { data: leads } = await query

  const planLimitReached =
    workspace?.plan === 'free' && (leads?.length ?? 0) >= 50

  return (
    <LeadsClient
      leads={leads ?? []}
      workspaceId={workspaceId}
      planLimitReached={planLimitReached}
      companies={companies}
      businessUnits={businessUnits}
      currentCompanyId={currentCompanyId}
    />
  )
}
