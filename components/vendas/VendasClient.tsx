'use client'

import { UserX, Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RepLeaderboard } from './RepLeaderboard'
import { RepStageBreakdown } from './RepStageBreakdown'
import { BUFilterSelect } from '@/components/shared/BUFilterSelect'
import { CompanyFilterSelect } from '@/components/shared/CompanyFilterSelect'
import type { BusinessUnit, Company, Deal, Lead, DealStage, SalesRole } from '@/types'

// ── Configuração de etapas ──────────────────────────────────────────
const STAGE_ORDER: DealStage[] = [
  'new_lead', 'contacted', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
]

const STAGE_STYLE: Record<DealStage, { label: string; bar: string; text: string }> = {
  new_lead:      { label: 'Novo Lead',   bar: 'bg-teal-500',   text: 'text-teal-500' },
  contacted:     { label: 'Contato',     bar: 'bg-cyan-500',   text: 'text-cyan-500' },
  proposal_sent: { label: 'Proposta',    bar: 'bg-indigo-500', text: 'text-indigo-500' },
  negotiation:   { label: 'Negociação',  bar: 'bg-amber-500',  text: 'text-amber-500' },
  closed_won:    { label: 'Ganho',       bar: 'bg-green-500',  text: 'text-green-500' },
  closed_lost:   { label: 'Perdido',     bar: 'bg-red-400',    text: 'text-red-400' },
}

// ── Badge de papel de vendas ────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  master:   'Master',
  director: 'Diretor',
  manager:  'Gerente',
  seller:   'Vendedor',
  admin:    'Admin',
  member:   'Membro',
}

const ROLE_STYLE: Record<string, string> = {
  master:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  director: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  manager:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  seller:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  admin:    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  member:   'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

// ── Tipos ───────────────────────────────────────────────────────────
interface Member {
  id: string
  user_id: string | null
  role: string
  sales_role: string | null
  email: string
  name?: string
}

interface VendasClientProps {
  members: Member[]
  deals: Deal[]
  leads: Lead[]
  businessUnits?: BusinessUnit[]
  companies?: Company[]
  currentCompanyId?: string | null
  currentBusinessUnitId?: string | null
}

// ── Cálculo de métricas por rep ─────────────────────────────────────
// userId = auth.users.id (mesmo valor de assigned_to nos deals/leads)
function calcMetrics(userId: string | null, deals: Deal[], leads: Lead[]) {
  const repDeals = deals.filter((d) =>
    userId ? d.assigned_to === userId : d.assigned_to === null
  )
  const repLeads = leads.filter((l) =>
    userId ? l.assigned_to === userId : l.assigned_to === null
  )
  const openDeals = repDeals.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  )
  const wonDeals = repDeals.filter((d) => d.stage === 'closed_won')
  const pipelineValue = openDeals.reduce((s, d) => s + (d.value ?? 0), 0)
  const wonValue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0)
  const conversionRate = repDeals.length
    ? Math.round((wonDeals.length / repDeals.length) * 100)
    : 0
  const byStage = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, repDeals.filter((d) => d.stage === s).length])
  ) as Record<DealStage, number>

  return { repDeals, repLeads, openDeals, wonDeals, pipelineValue, wonValue, conversionRate, byStage }
}

function initials(name?: string, email?: string): string {
  if (name) return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return '??'
}

// ── Card de um representante ────────────────────────────────────────
function RepCard({ member, deals, leads }: { member: Member | null; deals: Deal[]; leads: Lead[] }) {
  const isUnassigned = member === null
  // assigned_to nos deals/leads referencia auth.users.id (user_id), não workspace_member.id
  const userId = member?.user_id ?? null
  const { repDeals, repLeads, openDeals, pipelineValue, conversionRate, byStage } =
    calcMetrics(userId, deals, leads)

  const displayName = isUnassigned ? 'Não atribuídos' : (member.name ?? member.email)
  const displayEmail = isUnassigned ? '' : member.email
  const roleKey = isUnassigned ? null : (member.sales_role ?? member.role)
  const maxStage = Math.max(...STAGE_ORDER.map((s) => byStage[s] ?? 0), 1)

  const avatarColors = [
    'bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600',
    'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-orange-600',
  ]
  const colorIdx = member
    ? member.id.charCodeAt(0) % avatarColors.length
    : 0
  const avatarColor = isUnassigned ? 'bg-muted' : avatarColors[colorIdx]

  return (
    <Card className="flex flex-col border-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className={`${avatarColor} text-white text-sm font-semibold`}>
                {isUnassigned
                  ? <UserX className="w-5 h-5 text-muted-foreground" />
                  : initials(member?.name, member?.email)
                }
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
              {displayEmail && (
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              )}
            </div>
          </div>
          {roleKey && (
            <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLE[roleKey] ?? ROLE_STYLE.member}`}>
              {ROLE_LABEL[roleKey] ?? roleKey}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 space-y-5 pt-0">
        {/* Métricas resumidas */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{repLeads.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Leads</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{openDeals.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Abertos</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2 col-span-2">
            <p className="text-base font-bold text-foreground leading-tight">
              {formatCurrency(pipelineValue)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pipeline</p>
          </div>
        </div>

        {/* Conversão */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Taxa de conversão</span>
          <span className={`font-semibold ${conversionRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {conversionRate}%
          </span>
        </div>

        {/* Etapas do pipeline */}
        <div className="space-y-2 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Negócios por etapa
          </p>
          {repDeals.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Nenhum negócio atribuído</p>
          ) : (
            STAGE_ORDER.map((stage) => {
              const count = byStage[stage] ?? 0
              const pct = Math.round((count / maxStage) * 100)
              const { label, bar, text } = STAGE_STYLE[stage]
              return (
                <div key={stage} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-20 flex-shrink-0">{label}</span>
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div
                      className={`${bar} rounded-full h-1.5 transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium w-4 text-right ${count > 0 ? text : 'text-muted-foreground'}`}>
                    {count}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Componente principal ────────────────────────────────────────────
export function VendasClient({ members, deals, leads, businessUnits = [], companies = [], currentCompanyId = null, currentBusinessUnitId = null }: VendasClientProps) {
  const hasUnassigned =
    deals.some((d) => !d.assigned_to) || leads.some((l) => !l.assigned_to)

  const totalPipeline = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((s, d) => s + (d.value ?? 0), 0)

  const totalWon = deals.filter((d) => d.stage === 'closed_won').length
  const overallConversion = deals.length
    ? Math.round((totalWon / deals.length) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Representantes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Desempenho individual da equipe de vendas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CompanyFilterSelect
            companies={companies}
            currentCompanyId={currentCompanyId}
          />
          <BUFilterSelect
            businessUnits={businessUnits}
            currentCompanyId={currentCompanyId}
            currentBusinessUnitId={currentBusinessUnitId}
          />
        </div>
      </div>

      {/* Cards de resumo global */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Representantes',
            value: members.length,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
          },
          {
            label: 'Leads distribuídos',
            value: leads.filter((l) => l.assigned_to).length,
            icon: Users,
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-100 dark:bg-violet-900/30',
          },
          {
            label: 'Pipeline total',
            value: formatCurrency(totalPipeline),
            icon: DollarSign,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-100 dark:bg-green-900/30',
          },
          {
            label: 'Conversão geral',
            value: `${overallConversion}%`,
            icon: TrendingUp,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-100 dark:bg-orange-900/30',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficos analíticos */}
      {members.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de Representantes</CardTitle>
            </CardHeader>
            <CardContent>
              <RepLeaderboard
                reps={members
                  .filter((m) => m.user_id)
                  .map((m) => {
                    const { pipelineValue, openDeals, wonDeals, wonValue, conversionRate } = calcMetrics(m.user_id, deals, leads)
                    return {
                      name: m.name ?? m.email.split('@')[0],
                      pipelineValue,
                      openDeals: openDeals.length,
                      wonDeals: wonDeals.length,
                      wonValue,
                      conversionRate,
                    }
                  })}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Negócios por Etapa — por Rep</CardTitle>
            </CardHeader>
            <CardContent>
              <RepStageBreakdown
                data={members
                  .filter((m) => m.user_id)
                  .map((m) => {
                    const { byStage } = calcMetrics(m.user_id, deals, leads)
                    return {
                      name: m.name ?? m.email.split('@')[0],
                      ...byStage,
                    }
                  })}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid de cards por representante */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {members.map((member) => (
          <RepCard key={member.id} member={member} deals={deals} leads={leads} />
        ))}
        {hasUnassigned && (
          <RepCard key="unassigned" member={null} deals={deals} leads={leads} />
        )}
      </div>

      {members.length === 0 && !hasUnassigned && (
        <Card className="p-12 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-foreground">Nenhum representante encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Convide membros ao workspace nas Configurações.
          </p>
        </Card>
      )}
    </div>
  )
}
