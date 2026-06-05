'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Download, Send, Trash2, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PropostaStatusBadge } from './PropostaStatusBadge'
import { formatCurrency } from '@/lib/utils'
import type { Proposal, ProposalStatus } from '@/types'

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'sent', label: 'Enviada' },
  { value: 'awaiting_signature', label: 'Aguard. Assinatura' },
  { value: 'signed', label: 'Assinada' },
  { value: 'rejected', label: 'Recusada' },
  { value: 'expired', label: 'Expirada' },
]

type ProposalWithLead = Proposal & { leadCompany: string | null; leadName: string | null }

interface PropostasClientProps {
  proposals: ProposalWithLead[]
}

export function PropostasClient({ proposals }: PropostasClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta proposta? Esta ação não pode ser desfeita.')) return
    setDeletingId(id)
    await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    router.refresh()
  }

  async function handleStatusChange(id: string, status: ProposalStatus) {
    await fetch(`/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  function copyPublicLink(token: string, id: string) {
    const url = `${window.location.origin}/proposta/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Propostas</h1>
          <p className="text-muted-foreground text-sm mt-1">{proposals.length} proposta{proposals.length !== 1 ? 's' : ''} no total</p>
        </div>
        <Link href="/propostas/nova">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-1.5" />
            Nova proposta
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUS_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all' ? 'Nenhuma proposta encontrada.' : 'Nenhuma proposta criada ainda.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link href="/propostas/nova">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Criar primeira proposta
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(proposal => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/propostas/${proposal.id}`} className="text-sm font-semibold text-foreground hover:text-blue-600 truncate">
                        {proposal.title}
                      </Link>
                      <PropostaStatusBadge status={proposal.status} />
                    </div>
                    {proposal.leadCompany && (
                      <p className="text-xs text-muted-foreground mb-1">{proposal.leadCompany}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground">{formatCurrency(proposal.total_value)}</span>
                      {proposal.valid_until && (
                        <span>Válida até {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</span>
                      )}
                      <span>Criada em {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
                      {proposal.signed_by_client_at && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✓ Aceita em {new Date(proposal.signed_by_client_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Copiar link público */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      title="Copiar link do cliente"
                      onClick={() => copyPublicLink(proposal.public_token, proposal.id)}
                    >
                      {copiedId === proposal.id
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                        : <Copy className="w-4 h-4" />}
                    </Button>

                    {/* Download PDF */}
                    <a href={`/api/proposals/${proposal.id}/pdf`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" className="w-8 h-8" title="Baixar PDF">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>

                    {/* Marcar como enviada */}
                    {proposal.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-blue-600"
                        title="Marcar como enviada"
                        onClick={() => handleStatusChange(proposal.id, 'sent')}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Excluir */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-destructive"
                      title="Excluir"
                      onClick={() => handleDelete(proposal.id)}
                      disabled={deletingId === proposal.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
