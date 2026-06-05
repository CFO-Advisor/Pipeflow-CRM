'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { CompanyFilterSelect } from '@/components/shared/CompanyFilterSelect'
import type { SalesGoal, Commission, GoalType, Company } from '@/types'

interface MemberInfo {
  id: string
  user_id: string | null
  name?: string
  email: string
  sales_role: string | null
}

interface GoalWithProgress extends SalesGoal {
  achieved: number
  percentage: number
}

interface CommissionWithDeal extends Commission {
  deal?: { id: string; title: string; value: number } | null
  rule?: { name: string; percentage: number } | null
}

interface MetasClientProps {
  members: MemberInfo[]
  goals: GoalWithProgress[]
  commissions: CommissionWithDeal[]
  canManage: boolean
  companies?: Company[]
  currentCompanyId?: string | null
}

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  revenue: 'Receita (R$)',
  deals_count: 'Negócios fechados',
}

const PERIOD_PRESETS = [
  { label: 'Este mês', start: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0] }, end: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0] } },
  { label: 'Próximo mês', start: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().split('T')[0] }, end: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString().split('T')[0] } },
  { label: 'Este trimestre', start: () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3); return new Date(d.getFullYear(), q * 3, 1).toISOString().split('T')[0] }, end: () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3); return new Date(d.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0] } },
]

export function MetasClient({ members, goals, commissions, canManage, companies = [], currentCompanyId = null }: MetasClientProps) {
  const router = useRouter()
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({ member_id: '', goal_type: 'revenue' as GoalType, target_value: '', period_start: '', period_end: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'goals' | 'commissions'>('goals')

  async function saveGoal() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/sales-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...goalForm, target_value: parseFloat(goalForm.target_value) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Erro.'); return }
    setShowGoalForm(false)
    setGoalForm({ member_id: '', goal_type: 'revenue', target_value: '', period_start: '', period_end: '' })
    router.refresh()
  }

  async function deleteGoal(id: string) {
    if (!confirm('Excluir esta meta?')) return
    await fetch(`/api/sales-goals/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function markPaid(commissionId: string) {
    await fetch(`/api/commissions/${commissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    })
    router.refresh()
  }

  function getMemberName(memberId: string) {
    const m = members.find(m => m.id === memberId)
    return m?.name || m?.email || memberId
  }

  const pendingCommissions = commissions.filter(c => c.status === 'pending')
  const paidCommissions = commissions.filter(c => c.status === 'paid')
  const totalPending = pendingCommissions.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Metas & Comissões</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe o desempenho e as comissões da equipe</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CompanyFilterSelect
            companies={companies}
            currentCompanyId={currentCompanyId}
          />
          {canManage && (
            <Button onClick={() => setShowGoalForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1.5" />
              Nova meta
            </Button>
          )}
        </div>
      </div>

      {/* Resumo de comissões pendentes */}
      {totalPending > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Comissões pendentes</p>
            <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{formatCurrency(totalPending)}</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">{pendingCommissions.length} comissão{pendingCommissions.length !== 1 ? 'ões' : ''}</Badge>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['goals', 'commissions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'goals' ? `Metas (${goals.length})` : `Comissões (${commissions.length})`}
          </button>
        ))}
      </div>

      {/* Metas */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Target className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
                {canManage && <Button variant="outline" size="sm" onClick={() => setShowGoalForm(true)}><Plus className="w-4 h-4 mr-1.5" />Criar primeira meta</Button>}
              </CardContent>
            </Card>
          ) : (
            goals.map(goal => {
              const pct = Math.min(goal.percentage, 100)
              const over = goal.percentage > 100
              return (
                <Card key={goal.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{getMemberName(goal.member_id)}</p>
                            <p className="text-xs text-muted-foreground">
                              {GOAL_TYPE_LABELS[goal.goal_type]} · {new Date(goal.period_start).toLocaleDateString('pt-BR')} – {new Date(goal.period_end).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {goal.goal_type === 'revenue' ? formatCurrency(goal.achieved) : goal.achieved}
                              <span className="text-muted-foreground"> / </span>
                              {goal.goal_type === 'revenue' ? formatCurrency(goal.target_value) : goal.target_value}
                            </p>
                            <Badge className={over ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}>
                              {Math.round(goal.percentage)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${over ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      {canManage && (
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => deleteGoal(goal.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Comissões */}
      {activeTab === 'commissions' && (
        <div className="space-y-3">
          {commissions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma comissão registrada. Comissões são geradas ao fechar negócios com regras ativas.</p>
              </CardContent>
            </Card>
          ) : (
            commissions.map(c => (
              <Card key={c.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{getMemberName(c.member_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.deal?.title ?? 'Negócio'} · {c.percentage}% · Base: {formatCurrency(c.deal_value)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(c.amount)}</p>
                        <Badge variant="secondary" className={c.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}>
                          {c.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                      {canManage && c.status === 'pending' && (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-300" onClick={() => markPaid(c.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Marcar pago
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal de criação de meta */}
      <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>Representante</Label>
              <select value={goalForm.member_id} onChange={e => setGoalForm(p => ({ ...p, member_id: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Selecione...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de meta</Label>
              <select value={goalForm.goal_type} onChange={e => setGoalForm(p => ({ ...p, goal_type: e.target.value as GoalType }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="revenue">Receita (R$)</option>
                <option value="deals_count">Negócios fechados (quantidade)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valor alvo</Label>
              <Input type="number" min="0.01" step="0.01" value={goalForm.target_value} onChange={e => setGoalForm(p => ({ ...p, target_value: e.target.value }))} placeholder={goalForm.goal_type === 'revenue' ? '50000' : '10'} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Período</Label>
                <div className="flex gap-1">
                  {PERIOD_PRESETS.map(preset => (
                    <button key={preset.label} type="button" onClick={() => setGoalForm(p => ({ ...p, period_start: preset.start(), period_end: preset.end() }))} className="text-xs text-blue-600 hover:underline">{preset.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={goalForm.period_start} onChange={e => setGoalForm(p => ({ ...p, period_start: e.target.value }))} />
                <Input type="date" value={goalForm.period_end} onChange={e => setGoalForm(p => ({ ...p, period_end: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalForm(false)}>Cancelar</Button>
            <Button onClick={saveGoal} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Salvando...' : 'Criar meta'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
