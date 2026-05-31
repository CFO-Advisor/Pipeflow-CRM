import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Sidebar } from '@/components/layout/Sidebar'
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher'
import { UserMenu } from '@/components/layout/UserMenu'
import type { Workspace } from '@/types'

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

  // Cookie not set yet (first login / new workspace) — set it via route handler
  if (!savedId) {
    redirect(`/api/workspace/activate?id=${currentWorkspace.id}&next=/dashboard`)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen fixed left-0 top-0 z-40">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold">PipeFlow</span>
          </div>
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
          />
        </div>

        <div className="flex-1 p-4">
          <Sidebar />
        </div>

        <div className="p-4 border-t border-slate-800">
          <UserMenu
            email={user.email ?? ''}
            name={user.user_metadata?.full_name}
          />
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
