'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { ProposalTemplate } from '@/types'

interface ItemRow {
  description: string
  quantity: number
  unit_price: number
}

interface DealOption {
  id: string
  title: string
  company_id: string | null
  leadName: string | null
  leadCompany: string | null
}

interface CompanyOption {
  id: string
  name: string
}

interface PropostaFormProps {
  deals: DealOption[]
  templates: ProposalTemplate[]
  companies: CompanyOption[]
}

const SELECT_CLASS = 'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function PropostaForm({ deals, templates, companies }: PropostaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [form, setForm] = useState({
    deal_id: '',
    title: '',
    description: '',
    valid_until: '',
    notes: '',
  })
  const [items, setItems] = useState<ItemRow[]>([{ description: '', quantity: 1, unit_price: 0 }])

  // Filtrar deals pela empresa selecionada
  const filteredDeals = selectedCompanyId
    ? deals.filter(d => d.company_id === selectedCompanyId)
    : deals

  function handleCompanyChange(companyId: string) {
    setSelectedCompanyId(companyId)
    // Limpar deal se não pertence à nova empresa
    if (companyId && form.deal_id) {
      const deal = deals.find(d => d.id === form.deal_id)
      if (deal && deal.company_id !== companyId) {
        setForm(p => ({ ...p, deal_id: '' }))
      }
    }
  }

  function loadTemplate(templateId: string) {
    const tmpl = templates.find(t => t.id === templateId)
    if (!tmpl) return
    setItems(tmpl.items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)

  const selectedDeal = deals.find(d => d.id === form.deal_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.deal_id) { setError('Selecione um negócio.'); return }
    if (!form.title.trim()) { setError('Título é obrigatório.'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao criar proposta.'); setLoading(false); return }

    router.push(`/propostas/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Dados da Proposta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Empresa */}
          {companies.length > 0 && (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <select
                value={selectedCompanyId}
                onChange={e => handleCompanyChange(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Todas as empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Negócio */}
          <div className="space-y-2">
            <Label>Negócio *</Label>
            <select
              value={form.deal_id}
              onChange={e => setForm(p => ({ ...p, deal_id: e.target.value }))}
              className={SELECT_CLASS}
            >
              <option value="">
                {filteredDeals.length === 0 ? 'Nenhum negócio para essa empresa' : 'Selecione um negócio'}
              </option>
              {filteredDeals.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
            {/* Lead vinculado ao deal */}
            {selectedDeal?.leadName && (
              <p className="text-xs text-muted-foreground mt-1">
                Lead: <span className="text-foreground">{selectedDeal.leadName}</span>
                {selectedDeal.leadCompany && (
                  <span className="text-muted-foreground"> · {selectedDeal.leadCompany}</span>
                )}
              </p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Proposta Comercial — Consultoria"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_until">Válida até</Label>
              <Input
                id="valid_until"
                type="date"
                value={form.valid_until}
                onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
              />
            </div>
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>Carregar template</Label>
                <select onChange={e => loadTemplate(e.target.value)} className={SELECT_CLASS}>
                  <option value="">Selecione um template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Descreva o escopo desta proposta..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Itens */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Itens</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Adicionar item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-6 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Descrição</Label>}
                <Input
                  value={item.description}
                  onChange={e => updateItem(idx, 'description', e.target.value)}
                  placeholder="Produto ou serviço"
                />
              </div>
              <div className="col-span-2 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Qtd</Label>}
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-3 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Valor unit.</Label>}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-1">
                {idx === 0 && <div className="h-5" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2 border-t border-border">
            <span className="text-sm font-semibold text-foreground">Total: {formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <Label htmlFor="notes">Observações / Termos</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Condições de pagamento, prazo de entrega, garantias..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Proposta'}
        </Button>
      </div>
    </form>
  )
}
