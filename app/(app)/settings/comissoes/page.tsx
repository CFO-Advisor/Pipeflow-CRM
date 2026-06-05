import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommissionRuleForm } from '@/components/metas/CommissionRuleForm'
import type { CommissionRule } from '@/types'

const APPLIES_TO_LABELS: Record<string, string> = {
  all: 'Todos',
  seller: 'Vendedores',
  manager: 'Gerentes',
  director: 'Diretores',
  master: 'Masters',
}

export default async function ComissoesSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const service = createServiceClient()
  const { data: member } = await service.from('workspace_members').select('role, sales_role').eq('workspace_id', workspaceId).eq('user_id', user.id).single()
  const canManage = member?.role === 'admin' || member?.sales_role === 'master'
  if (!canManage) redirect('/settings')

  const { data: rules } = await service.from('commission_rules').select('*').eq('workspace_id', workspaceId).order('created_at')
  const allRules = (rules ?? []) as CommissionRule[]

  return (
    <div className="max-w-2xl w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground p-1 -ml-1 rounded-md hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Regras de Comissão</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Defina percentuais por papel de vendas</p>
        </div>
        {canManage && (
          <CommissionRuleForm trigger={
            <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Nova regra</Button>
          } />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regras ativas</CardTitle>
          <CardDescription>Ao fechar um negócio, as regras ativas são aplicadas automaticamente para calcular a comissão do responsável.</CardDescription>
        </CardHeader>
        <CardContent>
          {allRules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allRules.map(rule => (
                <div key={rule.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{rule.percentage}%</Badge>
                      <span className="text-xs text-muted-foreground">Para: {APPLIES_TO_LABELS[rule.applies_to] ?? rule.applies_to}</span>
                      {!rule.active && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CommissionRuleForm rule={rule} trigger={
                      <Button variant="ghost" size="icon" className="w-8 h-8"><Pencil className="w-3.5 h-3.5" /></Button>
                    } />
                    <ToggleRuleButton ruleId={rule.id} active={rule.active} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ToggleRuleButton({ ruleId, active }: { ruleId: string; active: boolean }) {
  return (
    <form action={async () => {
      'use server'
      const { cookies } = await import('next/headers')
      const { createServiceClient } = await import('@/lib/supabase/service')
      const cookieStore = await cookies()
      const workspaceId = cookieStore.get('current_workspace_id')?.value
      if (!workspaceId) return
      const service = createServiceClient()
      await service.from('commission_rules').update({ active: !active }).eq('id', ruleId).eq('workspace_id', workspaceId)
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/settings/comissoes')
    }}>
      <Button type="submit" variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" title={active ? 'Desativar' : 'Ativar'}>
        {active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4" />}
      </Button>
    </form>
  )
}
