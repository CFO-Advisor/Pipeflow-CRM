'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Building2, Mail, Phone, Trash2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { LeadForm } from './LeadForm'
import type { Lead } from '@/types'

interface LeadsClientProps {
  leads: Lead[]
  workspaceId: string
  planLimitReached: boolean
}

export function LeadsClient({ leads: initialLeads, workspaceId, planLimitReached }: LeadsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = initialLeads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.company ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lead?')) return
    const supabase = createClient()
    await supabase.from('leads').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {initialLeads.length} lead{initialLeads.length !== 1 ? 's' : ''} no workspace
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
          disabled={planLimitReached}
          title={planLimitReached ? 'Limite do plano Free atingido' : undefined}
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo lead</span>
        </Button>
      </div>

      {planLimitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Você atingiu o limite de 50 leads do plano Free.
          </p>
          <Link href="/settings/billing">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0">
              Fazer upgrade
            </Button>
          </Link>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, empresa ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {search ? 'Nenhum lead encontrado' : 'Nenhum lead ainda'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search
                    ? 'Tente buscar por outro termo.'
                    : 'Clique em "Novo lead" para adicionar seu primeiro contato.'}
                </p>
              </div>
              {!search && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                  disabled={planLimitReached}
                >
                  Adicionar lead
                </button>
              )}
            </div>
          </Card>
        ) : (
          filtered.map((lead) => (
            <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <Link href={`/leads/${lead.id}`} className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {lead.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground hover:text-blue-600 transition-colors">
                        {lead.name}
                      </p>
                      <div className="flex items-center flex-wrap gap-3 mt-1">
                        {lead.company && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3" /> {lead.company}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" /> {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {lead.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => handleDelete(lead.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <LeadForm
        open={showForm}
        onOpenChange={setShowForm}
        workspaceId={workspaceId}
        planLimitReached={planLimitReached}
      />
    </div>
  )
}
