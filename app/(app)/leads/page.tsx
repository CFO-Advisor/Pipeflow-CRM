import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LeadsClient } from '@/components/leads/LeadsClient'

export default async function LeadsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value

  if (!workspaceId) redirect('/dashboard')

  const [{ data: leads }, { data: workspace }] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    supabase.from('workspaces').select('plan').eq('id', workspaceId).single(),
  ])

  const planLimitReached =
    workspace?.plan === 'free' && (leads?.length ?? 0) >= 50

  return (
    <LeadsClient
      leads={leads ?? []}
      workspaceId={workspaceId}
      planLimitReached={planLimitReached}
    />
  )
}
