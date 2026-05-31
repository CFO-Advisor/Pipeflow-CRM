import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, Check, Crown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BillingActions } from '@/components/settings/BillingActions'

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

  const isPro = workspace.plan === 'pro'

  return (
    <div className="max-w-2xl w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-muted"
          aria-label="Voltar para Configurações"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Plano e cobrança</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plano atual</CardTitle>
            <Badge className={isPro ? 'bg-blue-600' : 'bg-slate-500'}>
              {isPro ? 'Pro' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {isPro
              ? 'Você tem acesso a todos os recursos Pro: colaboradores e leads ilimitados.'
              : 'Você está no plano gratuito: até 2 colaboradores e 50 leads.'}
          </p>
        </CardContent>
      </Card>

      {!isPro && (
        <Card className="border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Fazer upgrade para Pro</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold text-foreground">
              R$ 49<span className="text-base font-normal text-muted-foreground">/mês</span>
            </p>
            <ul className="space-y-2">
              {[
                'Colaboradores ilimitados',
                'Leads ilimitados',
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
              isPro={false}
            />
          </CardContent>
        </Card>
      )}

      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gerenciar assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acesse o portal do Stripe para atualizar seu método de pagamento, ver faturas ou cancelar.
            </p>
            <BillingActions
              workspaceId={workspaceId}
              stripeCustomerId={workspace.stripe_customer_id}
              isPro={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
