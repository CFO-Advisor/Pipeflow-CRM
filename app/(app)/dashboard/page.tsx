import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Users, Briefcase, TrendingUp, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/MetricCard'
import dynamic from 'next/dynamic'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { UpcomingDeals } from '@/components/dashboard/UpcomingDeals'
import { WonLostDonut } from '@/components/dashboard/WonLostDonut'
import { DealsAtRisk } from '@/components/dashboard/DealsAtRisk'
import { Skeleton } from '@/components/ui/skeleton'

const ConversionTrendChart = dynamic(
  () => import('@/components/dashboard/ConversionTrendChart').then((m) => ({ default: m.ConversionTrendChart })),
  { loading: () => <Skeleton className="h-[220px] w-full rounded-lg" /> }
)
const MonthlyRevenueChart = dynamic(
  () => import('@/components/dashboard/MonthlyRevenueChart').then((m) => ({ default: m.MonthlyRevenueChart })),
  { loading: () => <Skeleton className="h-[220px] w-full rounded-lg" /> }
)
const ActivityDistributionChart = dynamic(
  () => import('@/components/dashboard/ActivityDistributionChart').then((m) => ({ default: m.ActivityDistributionChart })),
  { loading: () => <Skeleton className="h-[220px] w-full rounded-lg" /> }
)
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { BUFilterSelect } from '@/components/shared/BUFilterSelect'
import { CompanyFilterSelect } from '@/components/shared/CompanyFilterSelect'
import { Suspense } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { BusinessUnit, Company, DealStage, DealWithLead } from '@/types'

const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: 'Novo',
  contacted: 'Contato',
  proposal_sent: 'Proposta',
  negotiation: 'Negoc.',
  closed_won: 'Ganho',
  closed_lost: 'Perdido',
}

function getPeriodStartDate(period: string): Date {
  const now = new Date()
  if (period === '30d') {
    now.setDate(now.getDate() - 30)
    return now
  }
  if (period === 'ytd') {
    return new Date(now.getFullYear(), 0, 1)
  }
  now.setDate(now.getDate() - 90)
  return now
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period = '90d' } = await searchParams
  const validPeriods = ['30d', '90d', 'ytd']
  const activePeriod = validPeriods.includes(period) ? period : '90d'
  const periodStart = getPeriodStartDate(activePeriod)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/register')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, plan')
    .eq('id', workspaceId)
    .single()

  const companyId = cookieStore.get('current_company_id')?.value ?? null
  const businessUnitId = cookieStore.get('current_business_unit_id')?.value ?? null

  let leadsQuery = supabase
    .from('leads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .gte('created_at', periodStart.toISOString())

  let dealsQuery = supabase
    .from('deals')
    .select('*, lead:leads(id, name, company)')
    .eq('workspace_id', workspaceId)
    .gte('created_at', periodStart.toISOString())

  let activitiesQuery = supabase
    .from('activities')
    .select('type, lead_id, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', periodStart.toISOString())

  // Buscar todos os deals abertos (sem filtro de período) para "em risco"
  let openDealsQuery = supabase
    .from('deals')
    .select('id, title, value, stage, deadline, workspace_id, lead:leads(id, name, assigned_to)')
    .eq('workspace_id', workspaceId)
    .not('stage', 'in', '("closed_won","closed_lost")')

  if (companyId) {
    leadsQuery = leadsQuery.eq('company_id', companyId)
    dealsQuery = dealsQuery.eq('company_id', companyId)
    activitiesQuery = activitiesQuery.eq('company_id', companyId)
    openDealsQuery = openDealsQuery.eq('company_id', companyId)
  }

  if (businessUnitId) {
    leadsQuery = leadsQuery.eq('business_unit_id', businessUnitId)
    dealsQuery = dealsQuery.eq('business_unit_id', businessUnitId)
    openDealsQuery = openDealsQuery.eq('business_unit_id', businessUnitId)
  }

  // Dados do período anterior para deltas
  const periodDays = activePeriod === 'ytd'
    ? Math.floor((Date.now() - periodStart.getTime()) / 86400000)
    : activePeriod === '30d' ? 30 : 90
  const prevPeriodStart = new Date(periodStart)
  prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays)

  let prevDealsQuery = supabase
    .from('deals')
    .select('id, stage, value')
    .eq('workspace_id', workspaceId)
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())

  if (companyId) prevDealsQuery = prevDealsQuery.eq('company_id', companyId)
  if (businessUnitId) prevDealsQuery = prevDealsQuery.eq('business_unit_id', businessUnitId)

  const busQuery = supabase
    .from('business_units')
    .select('id, workspace_id, company_id, name, active, created_at')
    .eq('workspace_id', workspaceId)
    .eq('active', true)
    .order('name')

  const companiesQuery = supabase
    .from('companies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  const [
    { data: leads },
    { data: deals },
    { data: activities },
    { data: openDealsRaw },
    { data: prevDeals },
    { data: busData },
    { data: companiesData },
  ] = await Promise.all([
    leadsQuery,
    dealsQuery,
    activitiesQuery,
    openDealsQuery,
    prevDealsQuery,
    busQuery,
    companiesQuery,
  ])
  const businessUnits = (busData ?? []) as BusinessUnit[]
  const companies = (companiesData ?? []) as Company[]

  // Resolve nome da empresa ativa a partir dos dados já carregados
  const activeCompanyName = companyId
    ? (companies.find((c) => c.id === companyId)?.name ?? null)
    : null

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const allDeals = (deals ?? []) as DealWithLead[]
  const openDeals = allDeals.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  )
  const closedWon = allDeals.filter((d) => d.stage === 'closed_won')
  const closedLost = allDeals.filter((d) => d.stage === 'closed_lost')
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const conversionRate = allDeals.length
    ? (closedWon.length / allDeals.length) * 100
    : 0

  // Deltas vs. período anterior
  const prev = prevDeals ?? []
  const prevOpen = prev.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
  const prevWon = prev.filter((d) => d.stage === 'closed_won')
  const prevPipeline = prevOpen.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const prevConversion = prev.length ? (prevWon.length / prev.length) * 100 : 0

  const dealsDelta = prevOpen.length > 0 ? ((openDeals.length - prevOpen.length) / prevOpen.length) * 100 : undefined
  const pipelineDelta = prevPipeline > 0 ? ((pipelineValue - prevPipeline) / prevPipeline) * 100 : undefined
  const conversionDelta = prevConversion > 0 ? conversionRate - prevConversion : undefined

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

  // Dados para o gráfico de tendência de conversão (mensal dos últimos 12m)
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
  twelveMonthsAgo.setDate(1)

  let allDeals12mQuery = supabase
    .from('deals')
    .select('stage, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', twelveMonthsAgo.toISOString())

  if (companyId) allDeals12mQuery = allDeals12mQuery.eq('company_id', companyId)
  if (businessUnitId) allDeals12mQuery = allDeals12mQuery.eq('business_unit_id', businessUnitId)

  const { data: allDeals12m } = await allDeals12mQuery

  const monthlyMap = new Map<string, { total: number; won: number }>()
  for (const d of allDeals12m ?? []) {
    const key = getMonthKey(d.created_at)
    const entry = monthlyMap.get(key) ?? { total: 0, won: 0 }
    entry.total += 1
    if (d.stage === 'closed_won') entry.won += 1
    monthlyMap.set(key, entry)
  }

  const conversionTrendData = Array.from(monthlyMap.entries()).map(([month, { total, won }]) => ({
    month,
    conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
    totalDeals: total,
  }))

  // Dados para receita mensal (closed_won dos últimos 12m)
  let wonDeals12mQuery = supabase
    .from('deals')
    .select('value, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('stage', 'closed_won')
    .gte('updated_at', twelveMonthsAgo.toISOString())

  if (companyId) wonDeals12mQuery = wonDeals12mQuery.eq('company_id', companyId)
  if (businessUnitId) wonDeals12mQuery = wonDeals12mQuery.eq('business_unit_id', businessUnitId)

  const { data: wonDeals12m } = await wonDeals12mQuery

  const revenueMap = new Map<string, number>()
  for (const d of wonDeals12m ?? []) {
    const key = getMonthKey(d.updated_at)
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + (d.value ?? 0))
  }
  const monthlyRevenueData = Array.from(revenueMap.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }))

  // Distribuição de atividades
  const activityTypeMap = new Map<string, number>()
  for (const a of activities ?? []) {
    activityTypeMap.set(a.type, (activityTypeMap.get(a.type) ?? 0) + 1)
  }
  const activityDistData = Array.from(activityTypeMap.entries()).map(([type, count]) => ({ type, count }))

  // Negócios em risco: prazo próximo OU sem atividade recente
  const now = new Date()
  const lastActivityMap = new Map<string, Date>()
  for (const a of activities ?? []) {
    const prev = lastActivityMap.get(a.lead_id)
    const curr = new Date(a.created_at)
    if (!prev || curr > prev) lastActivityMap.set(a.lead_id, curr)
  }

  const riskyDeals = (openDealsRaw ?? []).flatMap((deal: Record<string, unknown>) => {
    const lead = deal.lead as { id: string; name: string; assigned_to: string | null } | null
    const lastAct = lead ? lastActivityMap.get(lead.id) : undefined
    const daysSinceActivity = lastAct
      ? Math.floor((now.getTime() - lastAct.getTime()) / 86400000)
      : null
    const deadline = deal.deadline as string | null
    const daysUntilDeadline = deadline
      ? Math.floor((new Date(deadline).getTime() - now.getTime()) / 86400000)
      : null

    const isDeadlineRisk = daysUntilDeadline !== null && daysUntilDeadline <= 7
    const isStaleRisk = daysSinceActivity === null || daysSinceActivity >= 14

    if (!isDeadlineRisk && !isStaleRisk) return []

    return [{
      id: deal.id as string,
      title: deal.title as string,
      value: (deal.value as number) ?? 0,
      stage: deal.stage as string,
      deadline,
      daysSinceActivity,
      daysUntilDeadline,
      leadName: lead?.name ?? '—',
      repName: null,
    }]
  }).slice(0, 6)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCompanyName ? `${workspace?.name} · ${activeCompanyName}` : workspace?.name}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <CompanyFilterSelect
              companies={companies}
              currentCompanyId={companyId}
            />
            <BUFilterSelect
              businessUnits={businessUnits}
              currentCompanyId={companyId}
              currentBusinessUnitId={businessUnitId}
            />
          </div>
          <Suspense>
            <div className="order-1 sm:order-2">
              <PeriodSelector current={activePeriod} />
            </div>
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total de Leads"
          value={leads?.length ?? 0}
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <MetricCard
          label="Negócios Abertos"
          value={openDeals.length}
          icon={Briefcase}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          delta={dealsDelta}
          deltaLabel="vs. período anterior"
        />
        <MetricCard
          label="Valor do Pipeline"
          value={formatCurrency(pipelineValue)}
          icon={DollarSign}
          iconColor="text-green-600 dark:text-green-400"
          iconBg="bg-green-100 dark:bg-green-900/30"
          delta={pipelineDelta}
          deltaLabel="vs. período anterior"
        />
        <MetricCard
          label="Taxa de Conversão"
          value={`${Math.round(conversionRate)}%`}
          icon={TrendingUp}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          delta={conversionDelta}
          deltaLabel="pp vs. anterior"
        />
      </div>

      {/* Linha 2: Funil + Ganhos vs Perdidos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funil de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelChart data={funnelData} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ganhos vs. Perdidos</CardTitle>
          </CardHeader>
          <CardContent>
            <WonLostDonut won={closedWon.length} lost={closedLost.length} />
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Tendência de conversão + Receita mensal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendência de Conversão (12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversionTrendChart data={conversionTrendData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita Ganha por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyRevenueChart data={monthlyRevenueData} />
          </CardContent>
        </Card>
      </div>

      {/* Linha 4: Atividades + Prazos próximos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityDistributionChart data={activityDistData} />
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

      {/* Linha 5: Negócios em risco */}
      {riskyDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Negócios em Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <DealsAtRisk deals={riskyDeals} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
