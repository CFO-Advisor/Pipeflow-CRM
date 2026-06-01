import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { LeadsClient } from '@/components/leads/LeadsClient'
import type { Company } from '@/types'

export default async function LeadsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const service = createServiceClient()
  const { data: workspace } = await service
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  const isMax = workspace?.plan === 'max'

  // Empresas do grupo (somente plano MAX)
  let companies: Company[] = []
  if (isMax) {
    const { data } = await service
      .from('companies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .order('name')
    companies = (data ?? []) as Company[]
  }

  // Filtro de empresa ativo no sidebar
  const currentCompanyId = isMax
    ? (cookieStore.get('current_company_id')?.value ?? null)
    : null

  let query = service
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

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
      currentCompanyId={currentCompanyId}
    />
  )
}
