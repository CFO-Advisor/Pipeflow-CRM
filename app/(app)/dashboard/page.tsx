import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Users, Briefcase, TrendingUp, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { UpcomingDeals } from '@/components/dashboard/UpcomingDeals'
import { formatCurrency } from '@/lib/utils'
import type { DealStage, DealWithLead } from '@/types'

const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: 'Novo',
  contacted: 'Contato',
  proposal_sent: 'Proposta',
  negotiation: 'Negoc.',
  closed_won: 'Ganho',
  closed_lost: 'Perdido',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/register')

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const [{ data: leads }, { data: deals }, { data: workspace }] = await Promise.all([
    supabase.from('leads').select('id').eq('workspace_id', workspaceId),
    supabase
      .from('deals')
      .select('*, lead:leads(id, name, company)')
      .eq('workspace_id', workspaceId),
    supabase.from('workspaces').select('name, plan').eq('id', workspaceId).single(),
  ])

  const allDeals = (deals ?? []) as DealWithLead[]
  const openDeals = allDeals.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  )
  const closedWon = allDeals.filter((d) => d.stage === 'closed_won')
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const conversionRate = allDeals.length
    ? Math.round((closedWon.length / allDeals.length) * 100)
    : 0

  const upcomingDeals = allDeals
    .filter((d) => d.deadline && new Date(d.deadline) <= sevenDaysFromNow && d.stage !== 'closed_lost')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)

  const stageOrder: DealStage[] = [
    'new_lead', 'contacted', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
  ]
  const funnelData = stageOrder.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: allDeals.filter((d) => d.stage === stage).length,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{workspace?.name}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total de Leads"
          value={leads?.length ?? 0}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <MetricCard
          label="Negócios Abertos"
          value={openDeals.length}
          icon={Briefcase}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <MetricCard
          label="Valor do Pipeline"
          value={formatCurrency(pipelineValue)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <MetricCard
          label="Taxa de Conversão"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          description={`${closedWon.length} ganhos de ${allDeals.length} negócios`}
        />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnelData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Negócios com prazo próximo</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingDeals deals={upcomingDeals} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
