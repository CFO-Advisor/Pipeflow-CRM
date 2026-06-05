'use client'

import { useState } from 'react'
import { Briefcase, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActivityForm } from './ActivityForm'
import { ActivityTimeline } from './ActivityTimeline'
import { STAGE_LABELS } from '@/lib/deal-stages'
import type { ActivityWithAuthor, Deal, DealStage } from '@/types'

interface LeadActivityPanelProps {
  leadId: string
  workspaceId: string
  userId: string
  deals: Deal[]
  activities: ActivityWithAuthor[]
  leadEmail?: string | null
  leadPhone?: string | null
  leadName?: string
}

const STAGE_COLORS: Record<DealStage, string> = {
  new_lead:      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  contacted:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  proposal_sent: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  negotiation:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  closed_won:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed_lost:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function LeadActivityPanel({
  leadId,
  workspaceId,
  userId,
  deals,
  activities,
  leadEmail,
  leadPhone,
  leadName,
}: LeadActivityPanelProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    deals.length === 1 ? deals[0].id : null
  )

  const selectedDeal = deals.find(d => d.id === selectedDealId)

  // Filtrar atividades pelo negócio selecionado
  const dealActivities = selectedDealId
    ? activities.filter(a => a.deal_id === selectedDealId)
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Atividades por Negócio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Seleção de negócio — obrigatória */}
        {deals.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Briefcase className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhum negócio vinculado a este lead.
            </p>
            <p className="text-xs text-muted-foreground">
              Crie um negócio no painel ao lado para registrar atividades.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Selecione o negócio para ver e registrar atividades
              </p>
              <div className="flex flex-col gap-2">
                {deals.map(deal => (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id === selectedDealId ? null : deal.id)}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      selectedDealId === deal.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className={`w-4 h-4 flex-shrink-0 ${selectedDealId === deal.id ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium truncate ${selectedDealId === deal.id ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'}`}>
                        {deal.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${STAGE_COLORS[deal.stage]}`}
                      >
                        {STAGE_LABELS[deal.stage]}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo filtrado pelo negócio selecionado */}
            {selectedDeal ? (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {selectedDeal.title}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {dealActivities.length} atividade{dealActivities.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Registrar nova atividade */}
                <ActivityForm
                  leadId={leadId}
                  workspaceId={workspaceId}
                  userId={userId}
                  dealId={selectedDeal.id}
                  leadEmail={leadEmail}
                  leadPhone={leadPhone}
                  leadName={leadName}
                />

                {/* Timeline filtrada */}
                <ActivityTimeline
                  activities={dealActivities}
                  leadId={leadId}
                />
              </div>
            ) : (
              <div className="text-center py-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Selecione um negócio acima para ver e registrar atividades.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
