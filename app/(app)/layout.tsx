import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SidebarShell } from '@/components/layout/SidebarShell'
import type { Workspace, Company, BusinessUnit } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: memberships } = await service
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', user.id)

  const workspaces = (memberships ?? [])
    .map((m) => m.workspaces)
    .flat()
    .filter((w): w is Workspace => w !== null && !Array.isArray(w))

  if (workspaces.length === 0) redirect('/register')

  const cookieStore = await cookies()
  const savedId = cookieStore.get('current_workspace_id')?.value
  const currentWorkspace =
    workspaces.find((w) => w.id === savedId) ?? workspaces[0]

  // Redireciona se cookie ausente OU se aponta para workspace do qual o usuário não é membro
  if (!savedId || !workspaces.find((w) => w.id === savedId)) {
    redirect(`/api/workspace/activate?id=${currentWorkspace.id}&next=/dashboard`)
  }

  let companies: Company[] = []
  let currentCompanyId: string | null = null
  let businessUnits: BusinessUnit[] = []
  let currentBusinessUnitId: string | null = null

  // Carrega empresas para todos os planos
  const { data: companiesData } = await service
    .from('companies')
    .select('*')
    .eq('workspace_id', currentWorkspace.id)
    .order('name')

  companies = (companiesData ?? []) as Company[]

  // Carrega unidades de negócio para todos os planos
  const { data: busData } = await service
    .from('business_units')
    .select('*')
    .eq('workspace_id', currentWorkspace.id)
    .eq('active', true)
    .order('name')

  businessUnits = (busData ?? []) as BusinessUnit[]

  // CompanySwitcher (filtragem por empresa) permanece exclusivo do plano MAX
  if (currentWorkspace.plan === 'max') {
    currentCompanyId = cookieStore.get('current_company_id')?.value ?? null
    if (currentCompanyId && !companies.find((c) => c.id === currentCompanyId)) {
      currentCompanyId = null
    }

    // BusinessUnitSwitcher também exclusivo do plano MAX
    currentBusinessUnitId = cookieStore.get('current_business_unit_id')?.value ?? null
    if (currentBusinessUnitId && !businessUnits.find((bu) => bu.id === currentBusinessUnitId)) {
      currentBusinessUnitId = null
    }
  }

  const userEmail = user.email ?? ''
  const userName = user.user_metadata?.full_name as string | undefined

  return (
    <SidebarShell
      workspaces={workspaces}
      currentWorkspace={currentWorkspace}
      companies={companies}
      businessUnits={businessUnits}
      currentCompanyId={currentCompanyId}
      currentBusinessUnitId={currentBusinessUnitId}
      userEmail={userEmail}
      userName={userName}
    >
      {children}
    </SidebarShell>
  )
}
