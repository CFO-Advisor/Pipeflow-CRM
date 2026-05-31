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
import type { Lead } from '@/types'

interface LeadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  lead?: Lead
  planLimitReached?: boolean
}

export function LeadForm({ open, onOpenChange, workspaceId, lead, planLimitReached }: LeadFormProps) {
  const router = useRouter()
  const isEdit = !!lead

  const [form, setForm] = useState({
    name: lead?.name ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    company: lead?.company ?? '',
    position: lead?.position ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isEdit && planLimitReached) {
      setError('Limite de leads do plano Free atingido. Faça upgrade para Pro.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    if (isEdit) {
      const { error: err } = await supabase
        .from('leads')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', lead.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase
        .from('leads')
        .insert({ ...form, workspace_id: workspaceId })
      if (err) { setError(err.message); setLoading(false); return }
    }

    router.refresh()
    onOpenChange(false)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar lead' : 'Novo lead'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize as informações do contato.' : 'Adicione um novo lead ao seu CRM.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => update('company', e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={form.position}
                onChange={(e) => update('position', e.target.value)}
                placeholder="CEO, Gerente..."
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" disabled={loading}>
              {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
