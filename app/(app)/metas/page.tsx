import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { MetasClient } from '@/components/metas/MetasClient'
import type { SalesGoal, Commission, Company, CommissionRule, GoalBonusRule } from '@/types'

export default async function MetasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const companyId = cookieStore.get('current_company_id')?.value ?? null

  const service = createServiceClient()

  const [{ data: memberRows }, { data: goalsData }, { data: commissionsData }, { data: authData }, { data: companiesData }, { data: rulesData }, { data: bonusRulesData }] = await Promise.all([
    service.from('workspace_members').select('id, user_id, role, sales_role').eq('workspace_id', workspaceId),
    service.from('sales_goals').select('*').eq('workspace_id', workspaceId).order('period_start', { ascending: false }),
    service.from('commissions').select('*, deal:deals(id, title, value), rule:commission_rules(name, percentage)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    service.auth.admin.listUsers({ perPage: 1000 }),
    service.from('companies').select('*').eq('workspace_id', workspaceId).order('name'),
    service.from('commission_rules').select('*').eq('workspace_id', workspaceId).order('created_at'),
    service.from('goal_bonus_rules').select('*').eq('workspace_id', workspaceId).order('trigger_pct'),
  ])
  const companies = (companiesData ?? []) as Company[]

  const userMap = new Map((authData?.users ?? []).map(u => [u.id, { email: u.email ?? '', name: u.user_metadata?.full_name as string | undefined }]))
  const members = (memberRows ?? []).map(m => {
    const auth = m.user_id ? userMap.get(m.user_id) : null
    return { id: m.id, user_id: m.user_id, role: m.role, sales_role: m.sales_role, email: auth?.email ?? '', name: auth?.name }
  })

  const { data: currentMember } = await service.from('workspace_members').select('role, sales_role').eq('workspace_id', workspaceId).eq('user_id', user.id).single()
  const canManage = currentMember?.role === 'admin' || currentMember?.sales_role === 'master'

  // Calcular progresso de cada meta
  const closedWonDeals = await service
    .from('deals')
    .select('id, assigned_to, value, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('stage', 'closed_won')

  const goalsWithProgress = (goalsData ?? []).map(goal => {
    const deals = (closedWonDeals.data ?? []).filter(d => {
      const member = members.find(m => m.id === goal.member_id)
      if (!member || d.assigned_to !== member.user_id) return false
      const updatedAt = new Date(d.updated_at)
      return updatedAt >= new Date(goal.period_start) && updatedAt <= new Date(goal.period_end + 'T23:59:59')
    })
    const achieved = goal.goal_type === 'revenue'
      ? deals.reduce((s, d) => s + (d.value ?? 0), 0)
      : deals.length
    const percentage = goal.target_value > 0 ? (achieved / goal.target_value) * 100 : 0
    return { ...goal, achieved, percentage }
  })

  return (
    <MetasClient
      members={members}
      goals={goalsWithProgress as (SalesGoal & { achieved: number; percentage: number })[]}
      commissions={(commissionsData ?? []) as (Commission & { deal?: { id: string; title: string; value: number } | null; rule?: { name: string; percentage: number } | null })[]}
      commissionRules={(rulesData ?? []) as CommissionRule[]}
      goalBonusRules={(bonusRulesData ?? []) as GoalBonusRule[]}
      canManage={canManage}
      companies={companies}
      currentCompanyId={companyId}
    />
  )
}
