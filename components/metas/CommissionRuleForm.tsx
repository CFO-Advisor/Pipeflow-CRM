'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { CommissionRule } from '@/types'

interface CommissionRuleFormProps {
  rule?: CommissionRule
  trigger: React.ReactNode
}

export function CommissionRuleForm({ rule, trigger }: CommissionRuleFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: rule?.name ?? '',
    percentage: rule?.percentage?.toString() ?? '',
    applies_to: rule?.applies_to ?? 'all',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = rule ? `/api/commission-rules/${rule.id}` : '/api/commission-rules'
    const method = rule ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, percentage: parseFloat(form.percentage) }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || 'Erro.'); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rule ? 'Editar regra' : 'Nova regra de comissão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da regra</Label>
              <Input id="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Comissão padrão vendedores" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentual (%)</Label>
              <Input id="percentage" type="number" min="0" max="100" step="0.1" value={form.percentage} onChange={e => setForm(p => ({ ...p, percentage: e.target.value }))} placeholder="5" required />
            </div>
            <div className="space-y-2">
              <Label>Aplicar para</Label>
              <select value={form.applies_to} onChange={e => setForm(p => ({ ...p, applies_to: e.target.value as 'all' | 'seller' | 'manager' | 'director' | 'master' }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="all">Todos</option>
                <option value="seller">Vendedores</option>
                <option value="manager">Gerentes</option>
                <option value="director">Diretores</option>
                <option value="master">Masters</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? 'Salvando...' : rule ? 'Salvar' : 'Criar regra'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
