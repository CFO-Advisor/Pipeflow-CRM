import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InviteForm } from '@/components/settings/InviteForm'
import { MemberList } from '@/components/settings/MemberList'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const [{ data: workspace }, { data: memberRows }] = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
    supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId),
  ])

  if (!workspace) redirect('/dashboard')

  const currentMember = memberRows?.find((m) => m.user_id === user.id)
  const isAdmin = currentMember?.role === 'admin'
  const memberLimitReached = workspace.plan === 'free' && (memberRows?.length ?? 0) >= 2

  const userIds = (memberRows ?? []).map((m) => m.user_id).filter(Boolean)
  const { data: usersData } = await supabase.auth.admin?.listUsers?.() ?? { data: null }

  const members = (memberRows ?? []).map((m) => {
    const email = m.invited_email ?? m.user_id ?? 'Desconhecido'
    return { ...m, email, name: undefined as string | undefined }
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie seu workspace e equipe</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
          <CardDescription>Informações gerais do workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{workspace.name}</p>
              <p className="text-xs text-slate-500">{workspace.slug}</p>
            </div>
            <Badge className={workspace.plan === 'pro' ? 'bg-blue-600' : 'bg-slate-500'}>
              {workspace.plan === 'pro' ? 'Pro' : 'Free'}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Plano atual</p>
              <p className="text-xs text-slate-500">
                {workspace.plan === 'free'
                  ? 'Até 2 colaboradores e 50 leads'
                  : 'Colaboradores e leads ilimitados'}
              </p>
            </div>
            <Link href="/settings/billing">
              <Button variant="outline" size="sm">
                {workspace.plan === 'pro' ? 'Gerenciar assinatura' : 'Fazer upgrade'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipe</CardTitle>
          <CardDescription>
            {memberRows?.length ?? 0} colaborador{(memberRows?.length ?? 0) !== 1 ? 'es' : ''}
            {workspace.plan === 'free' && ` (máx. 2 no plano Free)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && (
            <>
              <InviteForm workspaceId={workspaceId} disabled={memberLimitReached} />
              <Separator />
            </>
          )}
          <MemberList
            members={members}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  )
}
