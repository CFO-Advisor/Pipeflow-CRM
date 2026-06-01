import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Sidebar } from '@/components/layout/Sidebar'
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher'
import { UserMenu } from '@/components/layout/UserMenu'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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

  if (!savedId) {
    redirect(`/api/workspace/activate?id=${currentWorkspace.id}&next=/dashboard`)
  }

  const userEmail = user.email ?? ''
  const userName = user.user_metadata?.full_name as string | undefined

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — hidden below lg */}
      <aside className="hidden lg:flex w-64 bg-sidebar text-sidebar-foreground flex-col min-h-screen fixed left-0 top-0 z-40">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold flex-1">PipeFlow</span>
            <ThemeToggle />
          </div>
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
          />
        </div>

        <div className="flex-1 p-4">
          <Sidebar />
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <UserMenu email={userEmail} name={userName} />
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      <MobileSidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        userEmail={userEmail}
        userName={userName}
      />

      {/* Main content: full-width on mobile, offset on desktop */}
      <main className="flex-1 lg:ml-64 min-w-0 px-4 py-6 pt-16 lg:pt-0 lg:p-8">
        {children}
      </main>
    </div>
  )
}
