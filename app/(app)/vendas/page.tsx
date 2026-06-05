import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCachedAuthUsers } from '@/lib/cached-queries'
import { VendasClient } from '@/components/vendas/VendasClient'
import type { BusinessUnit, Company, Deal, Lead } from '@/types'

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

  // Enriquecer com dados do auth (cacheado por 5 min)
  const authUsers = await getCachedAuthUsers()
  const userMap = new Map(
    authUsers.map((u) => [
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
    .limit(500)

  let leadsQuery = service
    .from('leads')
    .select('id, assigned_to, status')
    .eq('workspace_id', workspaceId)
    .limit(500)

  if (companyId) {
    dealsQuery = dealsQuery.eq('company_id', companyId)
    leadsQuery = leadsQuery.eq('company_id', companyId)
  }

  if (businessUnitId) {
    dealsQuery = dealsQuery.eq('business_unit_id', businessUnitId)
    leadsQuery = leadsQuery.eq('business_unit_id', businessUnitId)
  }

  const busQuery = service
    .from('business_units')
    .select('id, workspace_id, company_id, name, active, created_at')
    .eq('workspace_id', workspaceId)
    .eq('active', true)
    .order('name')

  const companiesQuery = service.from('companies').select('*').eq('workspace_id', workspaceId).order('name')

  const [{ data: deals }, { data: leads }, { data: busData }, { data: companiesData }] = await Promise.all([dealsQuery, leadsQuery, busQuery, companiesQuery])
  const businessUnits = (busData ?? []) as BusinessUnit[]
  const companies = (companiesData ?? []) as Company[]

  return (
    <VendasClient
      members={members}
      deals={(deals ?? []) as Deal[]}
      leads={(leads ?? []) as Lead[]}
      businessUnits={businessUnits}
      companies={companies}
      currentCompanyId={companyId}
      currentBusinessUnitId={businessUnitId}
    />
  )
}
