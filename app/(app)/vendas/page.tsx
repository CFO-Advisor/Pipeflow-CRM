import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { VendasClient } from '@/components/vendas/VendasClient'
import type { BusinessUnit, Deal, Lead } from '@/types'

export default async function VendasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const service = createServiceClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  const companyId = cookieStore.get('current_company_id')?.value ?? null
  const businessUnitId = cookieStore.get('current_business_unit_id')?.value ?? null

  // Membros do workspace
  const { data: memberRows } = await service
    .from('workspace_members')
    .select('id, user_id, role, sales_role')
    .eq('workspace_id', workspaceId)

  // Enriquecer com dados do auth
  const { data: authData } = await service.auth.admin.listUsers({ perPage: 1000 })
  const userMap = new Map(
    (authData?.users ?? []).map((u) => [
      u.id,
      {
        email: u.email ?? '',
        name: u.user_metadata?.full_name as string | undefined,
      },
    ])
  )

  const members = (memberRows ?? []).map((m) => {
    const auth = m.user_id ? userMap.get(m.user_id) : null
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role as string,
      sales_role: m.sales_role as string | null,
      email: auth?.email ?? '',
      name: auth?.name,
    }
  })

  // Deals e leads com filtro de empresa opcional
  let dealsQuery = service
    .from('deals')
    .select('id, assigned_to, stage, value, title')
    .eq('workspace_id', workspaceId)

  let leadsQuery = service
    .from('leads')
    .select('id, assigned_to, status')
    .eq('workspace_id', workspaceId)

  if (companyId) {
    dealsQuery = dealsQuery.eq('company_id', companyId)
    leadsQuery = leadsQuery.eq('company_id', companyId)
  }

  if (businessUnitId) {
    dealsQuery = dealsQuery.eq('business_unit_id', businessUnitId)
    leadsQuery = leadsQuery.eq('business_unit_id', businessUnitId)
  }

  const busQuery = companyId
    ? service.from('business_units').select('id, workspace_id, company_id, name, active, created_at').eq('workspace_id', workspaceId).eq('company_id', companyId).eq('active', true).order('name')
    : Promise.resolve({ data: [] })

  const [{ data: deals }, { data: leads }, { data: busData }] = await Promise.all([dealsQuery, leadsQuery, busQuery])
  const businessUnits = (busData ?? []) as BusinessUnit[]

  return (
    <VendasClient
      members={members}
      deals={(deals ?? []) as Deal[]}
      leads={(leads ?? []) as Lead[]}
      businessUnits={businessUnits}
      currentCompanyId={companyId}
      currentBusinessUnitId={businessUnitId}
    />
  )
}
