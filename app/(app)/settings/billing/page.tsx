import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, Check, Crown, Rocket } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BillingActions } from '@/components/settings/BillingActions'

const PLAN_LABELS = { free: 'Free', pro: 'Pro', max: 'MAX' } as const
const PLAN_COLORS = {
  free: 'secondary',
  pro: 'default',
  max: 'default',
} as const

export default async function BillingPage() {
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
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (!workspace) redirect('/dashboard')

  const plan = workspace.plan as 'free' | 'pro' | 'max'

  const planDescriptions: Record<typeof plan, string> = {
    free: 'Até 2 colaboradores e 50 leads.',
    pro: 'Colaboradores e leads ilimitados. Uma empresa.',
    max: 'Multi-empresa, hierarquia de vendas e controle de acesso por usuário.',
  }

  return (
    <div className="max-w-3xl w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-muted"
          aria-label="Voltar para Configurações"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Plano e cobrança</h1>
      </div>

      {/* Plano atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plano atual</CardTitle>
            <Badge
              variant={PLAN_COLORS[plan]}
              className={plan === 'max' ? 'bg-purple-600 text-white' : undefined}
            >
              {PLAN_LABELS[plan]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{planDescriptions[plan]}</p>
          {(plan === 'pro' || plan === 'max') && (
            <div className="mt-4">
              <BillingActions
                workspaceId={workspaceId}
                stripeCustomerId={workspace.stripe_customer_id}
                currentPlan={plan}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de upgrade — só exibem planos superiores ao atual */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Pro */}
        {plan === 'free' && (
          <Card className="border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Pro</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">
                R$ 49<span className="text-base font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="space-y-1.5">
                {[
                  'Colaboradores ilimitados',
                  'Leads e negócios ilimitados',
                  'Suporte prioritário',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <BillingActions
                workspaceId={workspaceId}
                stripeCustomerId={workspace.stripe_customer_id}
                currentPlan={plan}
                targetPlan="pro"
              />
            </CardContent>
          </Card>
        )}

        {/* MAX */}
        {(plan === 'free' || plan === 'pro') && (
          <Card className="border-purple-500 ring-2 ring-purple-100 dark:ring-purple-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base">MAX</CardTitle>
                <Badge className="ml-auto bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">
                  Novo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">
                R$ 100<span className="text-base font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="space-y-1.5">
                {[
                  'Múltiplas empresas no mesmo plano',
                  'Hierarquia Master → Diretor → Gerente → Vendedor',
                  'RLS por empresa, equipe e usuário',
                  'Permissões configuráveis por recurso',
                  'Visibilidade total para o Master',
                  'Tudo do plano Pro',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <BillingActions
                workspaceId={workspaceId}
                stripeCustomerId={workspace.stripe_customer_id}
                currentPlan={plan}
                targetPlan="max"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
