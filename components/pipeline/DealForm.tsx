'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DealStage, Lead } from '@/types'

interface DealFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  defaultStage: DealStage
  leads: Pick<Lead, 'id' | 'name'>[]
  companyId?: string | null
}

export function DealForm({ open, onOpenChange, workspaceId, defaultStage, leads, companyId }: DealFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    value: '',
    lead_id: '',
    deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.lead_id) { setError('Selecione um lead.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('deals').insert({
      workspace_id: workspaceId,
      lead_id: form.lead_id,
      title: form.title,
      value: parseFloat(form.value) || 0,
      stage: defaultStage,
      deadline: form.deadline || undefined,
      assigned_to: user?.id ?? null,
      ...(companyId ? { company_id: companyId } : {}),
    })

    if (err) { setError(err.message); setLoading(false); return }

    router.refresh()
    onOpenChange(false)
    setForm({ title: '', value: '', lead_id: '', deadline: '' })
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo negócio</DialogTitle>
          <DialogDescription>Adicione um negócio ao pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Lead *</Label>
            <Select value={form.lead_id} onValueChange={(v) => update('lead_id', v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lead">
                  {form.lead_id ? leads.find(l => l.id === form.lead_id)?.name : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id} label={lead.name}>{lead.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Proposta de consultoria"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => update('value', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => update('deadline', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" disabled={loading}>
              {loading ? 'Criando...' : 'Criar negócio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
