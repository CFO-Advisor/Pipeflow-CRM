import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCachedCompanies, getCachedBusinessUnits } from '@/lib/cached-queries'
import { SidebarShell } from '@/components/layout/SidebarShell'
import type { Workspace, Company, BusinessUnit } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (user.user_metadata?.must_change_password === true) {
    redirect('/set-password')
  }

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

  let currentCompanyId: string | null = null
  let currentBusinessUnitId: string | null = null

  // Empresas e BUs com cache de 30 s — evita re-fetch em cada navegação
  const [companies, businessUnits] = await Promise.all([
    getCachedCompanies(currentWorkspace.id),
    getCachedBusinessUnits(currentWorkspace.id),
  ])

  // Filtro por empresa e BU disponível para todos os planos
  if (companies.length > 0) {
    currentCompanyId = cookieStore.get('current_company_id')?.value ?? null
    if (currentCompanyId && !companies.find((c) => c.id === currentCompanyId)) {
      currentCompanyId = null
    }
  }

  if (businessUnits.length > 0) {
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
