'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar, DollarSign, User, Building2, Pencil, Paperclip, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DealEditForm } from './DealEditForm'
import { DealAttachmentsModal } from './DealAttachmentsModal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { DealStage, DealWithLead } from '@/types'

// Borda lateral que indica a "temperatura" do negócio — mais quente = mais próximo de fechar
const stageAccent: Record<DealStage, string> = {
  new_lead: 'border-l-blue-400',
  contacted: 'border-l-cyan-500',
  proposal_sent: 'border-l-violet-500',
  negotiation: 'border-l-amber-500',
  closed_won: 'border-l-green-500',
  closed_lost: 'border-l-red-400',
}

interface DealCardProps {
  deal: DealWithLead
  showCompany?: boolean
}

export function DealCard({ deal, showCompany }: DealCardProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDeleteConfirmed() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('deals').delete().eq('id', deal.id)
    router.refresh()
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { stage: deal.stage },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    // 'none' sobrescreve transition-all da classe CSS durante o drag; undefined deixaria a classe CSS assumir com delay
    transition: isDragging ? 'none' : (transition ?? 'transform 150ms ease'),
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue = deal.deadline && new Date(deal.deadline) < new Date()
  const accent = stageAccent[deal.stage]

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <Card className={`p-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default bg-card border-l-4 ${accent}`}>
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors duration-150"
              aria-label="Arrastar"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <p className="text-sm font-medium text-foreground leading-snug">{deal.title}</p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => setShowAttachments(true)}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-amber-500 transition-colors duration-150"
                    aria-label="Anexos"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-blue-500 transition-colors duration-150"
                    aria-label="Editar negócio"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleting}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-red-500 transition-colors duration-150 disabled:opacity-50"
                    aria-label="Excluir negócio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {showCompany && deal.company && (
                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                  <Building2 className="w-2.5 h-2.5" />
                  {deal.company.name}
                </span>
              )}
              {deal.lead && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  <User className="w-3 h-3 inline mr-1" />
                  {deal.lead.name}
                  {deal.lead.company && ` · ${deal.lead.company}`}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {deal.value > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                    <DollarSign className="w-3 h-3" />
                    {formatCurrency(deal.value)}
                  </span>
                )}
                {deal.deadline && (
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {formatDate(deal.deadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <DealEditForm
        key={deal.id}
        open={showEdit}
        onOpenChange={setShowEdit}
        deal={deal}
      />

      <DealAttachmentsModal
        open={showAttachments}
        onOpenChange={setShowAttachments}
        deal={deal}
        workspaceId={deal.workspace_id}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir negócio"
        description={`"${deal.title}" será excluído permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirmed}
      />
    </>
  )
}
