'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateDealStage } from '@/app/actions/deals'
import { STAGE_ORDER, STAGE_LABELS } from '@/lib/deal-stages'
import { formatCurrency } from '@/lib/utils'
import type { BusinessUnit, Deal, DealStage } from '@/types'

interface LeadDealPanelProps {
  leadId: string
  workspaceId: string
  companyId: string | null
  deals: Deal[]
  businessUnits?: BusinessUnit[]
}

const emptyForm = { title: '', value: '', deadline: '', stage: 'new_lead' as DealStage }

export function LeadDealPanel({ leadId, workspaceId, companyId, deals, businessUnits = [] }: LeadDealPanelProps) {
  const router = useRouter()

  const [showForm, setShowForm] = useState(deals.length === 0)
  const [form, setForm] = useState(emptyForm)
  const [businessUnitId, setBusinessUnitId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Estágio local por negócio (atualização otimista). Sincroniza quando o
  // servidor retorna novos dados após router.refresh().
  const [stages, setStages] = useState<Record<string, DealStage>>(
    () => Object.fromEntries(deals.map((d) => [d.id, d.stage]))
  )
  useEffect(() => {
    setStages(Object.fromEntries(deals.map((d) => [d.id, d.stage])))
  }, [deals])

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleStageChange(dealId: string, newStage: DealStage) {
    const prev = stages[dealId]
    if (!newStage || newStage === prev) return

    setStages((s) => ({ ...s, [dealId]: newStage }))
    setSavingId(dealId)
    setError('')
    try {
      await updateDealStage(dealId, newStage)
      router.refresh()
    } catch {
      setStages((s) => ({ ...s, [dealId]: prev }))
      setError('Falha ao atualizar o estágio do negócio.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Informe o título do negócio.')
      return
    }

    setCreating(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('deals').insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      title: form.title.trim(),
      value: parseFloat(form.value) || 0,
      stage: form.stage,
      deadline: form.deadline || null,
      assigned_to: user?.id ?? null,
      ...(companyId ? { company_id: companyId } : {}),
      ...(businessUnitId ? { business_unit_id: businessUnitId } : {}),
    })

    if (err) {
      setError(err.message)
      setCreating(false)
      return
    }

    setForm(emptyForm)
    setBusinessUnitId(null)
    setShowForm(false)
    router.refresh()
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Negócios existentes */}
      {deals.length > 0 && (
        <div className="space-y-2">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(deal.value)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {savingId === deal.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                )}
                <Select
                  value={stages[deal.id] ?? deal.stage}
                  onValueChange={(v) => handleStageChange(deal.id, v as DealStage)}
                  disabled={savingId === deal.id}
                >
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue>{STAGE_LABELS[stages[deal.id] ?? deal.stage]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage} label={STAGE_LABELS[stage]}>
                        {STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão para revelar o formulário (quando já há negócios) */}
      {!showForm && (
        <Button variant="outline" size="sm" onClick={() => { setShowForm(true); setError('') }}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Novo negócio
        </Button>
      )}

      {/* Formulário de novo negócio */}
      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-border p-4">
          {deals.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Este lead ainda não tem negócios. Lance o primeiro — ele aparece automaticamente no Pipeline.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="deal-title">Título *</Label>
            <Input
              id="deal-title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Ex: Proposta de consultoria"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-value">Valor (R$)</Label>
              <Input
                id="deal-value"
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => update('value', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-deadline">Prazo</Label>
              <Input
                id="deal-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => update('deadline', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Estágio</Label>
              <Select value={form.stage} onValueChange={(v) => update('stage', (v as DealStage) ?? 'new_lead')}>
                <SelectTrigger className="w-full">
                  <SelectValue>{STAGE_LABELS[form.stage]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage} label={STAGE_LABELS[stage]}>
                      {STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unidade de Negócio — só aparece quando há empresa e BUs disponíveis */}
          {companyId && businessUnits.filter(bu => bu.company_id === companyId).length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="deal-bu">Unidade de Negócio</Label>
              <select
                id="deal-bu"
                value={businessUnitId ?? ''}
                onChange={(e) => setBusinessUnitId(e.target.value || null)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Nenhuma</option>
                {businessUnits
                  .filter(bu => bu.company_id === companyId)
                  .map(bu => (
                    <option key={bu.id} value={bu.id}>{bu.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {deals.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); setForm(emptyForm); setError('') }}
                disabled={creating}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              disabled={creating}
            >
              {creating
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Criando...</>
                : 'Criar negócio'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
