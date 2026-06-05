import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Building2, Users, Rocket } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InviteForm } from '@/components/settings/InviteForm'
import { MemberList } from '@/components/settings/MemberList'
import { MaxMemberList } from '@/components/settings/MaxMemberList'
import type { Company } from '@/types'

const PLAN_LABELS = { free: 'Free', pro: 'Pro', max: 'MAX' }
const PLAN_BADGE_STYLES: Record<string, string> = {
  free: '',
  pro: '',
  max: 'bg-purple-600 text-white border-transparent',
}

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

  const isMax = workspace.plan === 'max'
  const currentMember = memberRows?.find((m) => m.user_id === user.id)
  const isAdmin = currentMember?.role === 'admin'
  const isMaster = currentMember?.sales_role === 'master'
  const canManageRoles = isAdmin || isMaster
  const memberLimitReached = workspace.plan === 'free' && (memberRows?.length ?? 0) >= 2

  // Buscar companies para todos os planos; extras (permissões, acesso) somente no MAX
  let companies: Company[] = []
  let membersWithExtras: typeof memberRows = memberRows ?? []

  {
    const service = createServiceClient()
    const { data: companiesData } = await service
      .from('companies').select('*').eq('workspace_id', workspaceId).order('name')
    companies = companiesData ?? []
  }

  if (isMax) {
    const service = createServiceClient()
    const [{ data: ucaData }, { data: permsData }] = await Promise.all([
      service.from('user_company_access').select('*').in(
        'member_id',
        (memberRows ?? []).map((m) => m.id)
      ),
      service.from('user_permissions').select('*').in(
        'member_id',
        (memberRows ?? []).map((m) => m.id)
      ),
    ])

    membersWithExtras = (memberRows ?? []).map((m) => ({
      ...m,
      company_access: (ucaData ?? []).filter((u) => u.member_id === m.id),
      permissions: (permsData ?? []).filter((p) => p.member_id === m.id),
    }))
  }

  // Enriquecer membros com e-mail via service (auth.users não é acessível pelo cliente normal)
  const service = createServiceClient()
  const { data: authUsers } = await service.auth.admin.listUsers()
  const userMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, { email: u.email ?? '', name: u.user_metadata?.full_name as string | undefined }])
  )

  const members = (membersWithExtras ?? []).map((m) => {
    const authUser = m.user_id ? userMap.get(m.user_id) : null
    return {
      ...m,
      email: authUser?.email ?? m.invited_email ?? 'Membro',
      name: authUser?.name,
    }
  })

  const planDesc: Record<string, string> = {
    free: 'Até 2 colaboradores e 50 leads',
    pro: 'Colaboradores e leads ilimitados',
    max: 'Multi-empresa · Hierarquia de vendas · Controle de acesso',
  }

  return (
    <div className="max-w-2xl w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu workspace e equipe</p>
      </div>

      {/* Workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
          <CardDescription>Informações gerais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{workspace.name}</p>
              <p className="text-xs text-muted-foreground">{workspace.slug}</p>
            </div>
            <Badge
              variant={workspace.plan === 'free' ? 'secondary' : 'default'}
              className={PLAN_BADGE_STYLES[workspace.plan]}
            >
              {PLAN_LABELS[workspace.plan as keyof typeof PLAN_LABELS]}
            </Badge>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Plano atual</p>
              <p className="text-xs text-muted-foreground">
                {planDesc[workspace.plan] ?? workspace.plan}
              </p>
            </div>
            <Link href="/settings/billing">
              <Button variant="outline" size="sm" className="flex-shrink-0">
                {workspace.plan === 'free' ? 'Fazer upgrade' : 'Gerenciar assinatura'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Empresas — disponível em todos os planos */}
      {(
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresas
                </CardTitle>
                <CardDescription>
                  {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Link href="/settings/companies">
                <Button variant="outline" size="sm">Gerenciar</Button>
              </Link>
            </div>
          </CardHeader>
          {companies.length > 0 && (
            <CardContent>
              <div className="divide-y divide-border">
                {companies.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    {!c.active && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                  </div>
                ))}
                {companies.length > 4 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    +{companies.length - 4} outras empresas
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Equipe */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Equipe
          </CardTitle>
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

          {/* Lista de membros */}
          {isMax ? (
            <MaxMemberList
              members={members}
              companies={companies}
              currentUserId={user.id}
              canManageRoles={canManageRoles}
            />
          ) : (
            <MemberList
              members={members}
              currentUserId={user.id}
              isAdmin={isAdmin}
            />
          )}
        </CardContent>
      </Card>

      {/* Banner de upgrade para MAX */}
      {workspace.plan !== 'max' && (
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Rocket className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Precisa de mais controle?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O plano MAX oferece múltiplas empresas, hierarquia de vendas e RLS por usuário.
                </p>
              </div>
              <Link href="/settings/billing">
                <Button size="sm" className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white">
                  Ver MAX
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

