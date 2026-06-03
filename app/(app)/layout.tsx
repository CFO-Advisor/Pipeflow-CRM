import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SidebarShell } from '@/components/layout/SidebarShell'
import type { Workspace, Company } from '@/types'

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

  if (currentWorkspace.plan === 'max') {
    const { data: companiesData } = await service
      .from('companies')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('name')

    companies = (companiesData ?? []) as Company[]
    currentCompanyId = cookieStore.get('current_company_id')?.value ?? null

    if (currentCompanyId && !companies.find((c) => c.id === currentCompanyId)) {
      currentCompanyId = null
    }
  }

  const userEmail = user.email ?? ''
  const userName = user.user_metadata?.full_name as string | undefined

  return (
    <SidebarShell
      workspaces={workspaces}
      currentWorkspace={currentWorkspace}
      companies={companies}
      currentCompanyId={currentCompanyId}
      userEmail={userEmail}
      userName={userName}
    >
      {children}
    </SidebarShell>
  )
}
