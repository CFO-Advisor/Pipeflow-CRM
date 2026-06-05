import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCachedAuthUsers } from '@/lib/cached-queries'
import { CalendarioClient } from '@/components/calendario/CalendarioClient'
import type { Company } from '@/types'

export default async function CalendarioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  const isMax = workspace?.plan === 'max'
  const service = createServiceClient()

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

  const currentCompanyId = isMax
    ? (cookieStore.get('current_company_id')?.value ?? null)
    : null

  // Membros da equipe com nomes
  const { data: memberRowsRaw } = await service
    .from('workspace_members')
    .select('id, user_id, role, sales_role')
    .eq('workspace_id', workspaceId)

  type MemberRow = { id: string; user_id: string | null; role: string; sales_role: string | null }
  const memberRows = (memberRowsRaw ?? []) as MemberRow[]

  const authUsers = await getCachedAuthUsers()
  const userMap = new Map(
    authUsers.map((u) => [
      u.id,
      { email: u.email ?? '', name: u.user_metadata?.full_name as string | undefined },
    ])
  )

  const members = memberRows.map((m) => {
    const auth = m.user_id ? userMap.get(m.user_id) : null
    return {
      id: m.id,
      userId: m.user_id,
      email: auth?.email ?? '',
      name: auth?.name,
    }
  })

  return (
    <CalendarioClient
      workspaceId={workspaceId}
      members={members}
      currentUserId={user.id}
      isMax={isMax}
      companies={companies}
      currentCompanyId={currentCompanyId}
    />
  )
}
