import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { CalendarioClient } from '@/components/calendario/CalendarioClient'

export default async function CalendarioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const service = createServiceClient()

  // Membros da equipe com nomes
  const { data: memberRows } = await service
    .from('workspace_members')
    .select('id, user_id, role, sales_role')
    .eq('workspace_id', workspaceId)

  const { data: authData } = await service.auth.admin.listUsers({ perPage: 1000 })
  const userMap = new Map(
    (authData?.users ?? []).map((u) => [
      u.id,
      { email: u.email ?? '', name: u.user_metadata?.full_name as string | undefined },
    ])
  )

  const members = (memberRows ?? []).map((m) => {
    const auth = m.user_id ? userMap.get(m.user_id) : null
    return {
      id: m.id as string,
      userId: (m.user_id as string | null) ?? null,
      email: auth?.email ?? '',
      name: auth?.name,
    }
  })

  return (
    <CalendarioClient
      workspaceId={workspaceId}
      members={members}
      currentUserId={user.id}
    />
  )
}
