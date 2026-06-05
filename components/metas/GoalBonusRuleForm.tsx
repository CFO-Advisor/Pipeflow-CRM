'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { GoalBonusRule, BonusType } from '@/types'

interface GoalBonusRuleFormProps {
  rule?: GoalBonusRule
  trigger: React.ReactNode
}

const TRIGGER_PRESETS = [80, 100, 120]

const BONUS_TYPE_LABELS: Record<BonusType, string> = {
  fixed:       'Valor fixo (R$)',
  salary_pct:  '% do salário base',
  revenue_pct: '% da receita do período',
}

const BONUS_TYPE_HINTS: Record<BonusType, string> = {
  fixed:       'Valor em R$ pago ao atingir o gatilho. Ex: 1000 = R$ 1.000,00',
  salary_pct:  'Percentual do salário base. Ex: 100 = um salário completo como bônus',
  revenue_pct: 'Percentual aplicado sobre a receita gerada no período. Ex: 5 = 5% do total vendido',
}

const BONUS_VALUE_PLACEHOLDER: Record<BonusType, string> = {
  fixed:       '1000',
  salary_pct:  '100',
  revenue_pct: '5',
}

export function GoalBonusRuleForm({ rule, trigger }: GoalBonusRuleFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name:        rule?.name ?? '',
    trigger_pct: rule?.trigger_pct?.toString() ?? '100',
    bonus_type:  (rule?.bonus_type ?? 'fixed') as BonusType,
    bonus_value: rule?.bonus_value?.toString() ?? '',
    applies_to:  rule?.applies_to ?? 'all',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url    = rule ? `/api/goal-bonus-rules/${rule.id}` : '/api/goal-bonus-rules'
    const method = rule ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        trigger_pct: parseFloat(form.trigger_pct),
        bonus_value: parseFloat(form.bonus_value),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || 'Erro ao salvar.'); return }
    setOpen(false)
    router.refresh()
  }

  function handleOpen() {
    // Reset to rule values when opening (handles edit re-open)
    setForm({
      name:        rule?.name ?? '',
      trigger_pct: rule?.trigger_pct?.toString() ?? '100',
      bonus_type:  (rule?.bonus_type ?? 'fixed') as BonusType,
      bonus_value: rule?.bonus_value?.toString() ?? '',
      applies_to:  rule?.applies_to ?? 'all',
    })
    setError('')
    setOpen(true)
  }

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">{trigger}</div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rule ? 'Editar bônus de meta' : 'Nova regra de bônus'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="bonus-name">Nome da regra</Label>
              <Input
                id="bonus-name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Bônus de atingimento de meta"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Disparar ao atingir (%)</Label>
              <div className="flex gap-2">
                {TRIGGER_PRESETS.map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, trigger_pct: pct.toString() }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                      form.trigger_pct === pct.toString()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-border text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <Input
                  type="number"
                  min="1"
                  max="300"
                  step="1"
                  value={form.trigger_pct}
                  onChange={e => setForm(p => ({ ...p, trigger_pct: e.target.value }))}
                  className="w-24"
                  placeholder="100"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O bônus é desbloqueado quando o representante atingir este % da meta.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de bônus</Label>
              <select
                value={form.bonus_type}
                onChange={e => setForm(p => ({ ...p, bonus_type: e.target.value as BonusType }))}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.keys(BONUS_TYPE_LABELS) as BonusType[]).map(type => (
                  <option key={type} value={type}>{BONUS_TYPE_LABELS[type]}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{BONUS_TYPE_HINTS[form.bonus_type]}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus-value">
                {form.bonus_type === 'fixed' ? 'Valor (R$)' : 'Percentual (%)'}
              </Label>
              <Input
                id="bonus-value"
                type="number"
                min="0.01"
                step={form.bonus_type === 'fixed' ? '0.01' : '0.1'}
                value={form.bonus_value}
                onChange={e => setForm(p => ({ ...p, bonus_value: e.target.value }))}
                placeholder={BONUS_VALUE_PLACEHOLDER[form.bonus_type]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Aplicar para</Label>
              <select
                value={form.applies_to}
                onChange={e => setForm(p => ({ ...p, applies_to: e.target.value as GoalBonusRule['applies_to'] }))}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Todos</option>
                <option value="seller">Vendedores</option>
                <option value="manager">Gerentes</option>
                <option value="director">Diretores</option>
                <option value="master">Masters</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Salvando...' : rule ? 'Salvar' : 'Criar regra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
