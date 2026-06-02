'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActivityType } from '@/types'

interface ActivityFormProps {
  leadId: string
  workspaceId: string
  userId: string
}

const activityLabels: Record<ActivityType, string> = {
  call:     'Ligação',
  email:    'E-mail',
  meeting:  'Reunião',
  note:     'Nota',
  proposal: 'Envio de Proposta',
}

const ACCEPT_PROPOSAL = '.pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ActivityForm({ leadId, workspaceId, userId }: ActivityFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<ActivityType>('note')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [proposalFile, setProposalFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleTypeChange(v: string | null) {
    if (!v) return
    setType(v as ActivityType)
    if (v !== 'proposal') {
      setProposalFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setProposalFile(file)
  }

  function removeFile() {
    setProposalFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    if (type === 'proposal' && !proposalFile) {
      setError('Anexe o arquivo da proposta.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    // 1. Inserir atividade e obter o ID gerado
    const { data: newActivity, error: insertErr } = await supabase
      .from('activities')
      .insert({
        lead_id: leadId,
        workspace_id: workspaceId,
        author_id: userId,
        type,
        description: description.trim(),
        scheduled_at: scheduledAt || null,
      })
      .select('id')
      .single()

    if (insertErr || !newActivity) {
      setError('Falha ao registrar atividade. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Upload do arquivo de proposta (se houver)
    if (type === 'proposal' && proposalFile) {
      const ext = proposalFile.name.split('.').pop()
      const filePath = `${workspaceId}/atividades/${newActivity.id}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('deal-attachments')
        .upload(filePath, proposalFile, { contentType: proposalFile.type })

      if (uploadErr) {
        setError(`Atividade registrada, mas falha no upload: ${uploadErr.message}`)
        setLoading(false)
        router.refresh()
        return
      }

      const { data: urlData } = supabase.storage
        .from('deal-attachments')
        .getPublicUrl(filePath)

      // 3. Atualizar atividade com URL e nome do arquivo
      await supabase
        .from('activities')
        .update({
          attachment_url: urlData.publicUrl,
          attachment_name: proposalFile.name,
        })
        .eq('id', newActivity.id)
    }

    setDescription('')
    setScheduledAt('')
    setProposalFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Tipo */}
        <div>
          <Label className="mb-1.5 block">Tipo</Label>
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(activityLabels) as [ActivityType, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value} label={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data agendada */}
        <div>
          <Label htmlFor="scheduled_at" className="mb-1.5 block">
            Data agendada <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="scheduled_at"
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {/* Upload de proposta — só aparece quando tipo = proposal */}
      {type === 'proposal' && (
        <div className="space-y-1.5">
          <Label>
            Arquivo da proposta <span className="text-destructive">*</span>
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_PROPOSAL}
            className="hidden"
            onChange={handleFileSelect}
          />

          {proposalFile ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{proposalFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(proposalFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 transition-colors py-4 text-sm text-muted-foreground"
            >
              <Upload className="w-4 h-4" />
              Clique para anexar a proposta
              <span className="text-xs opacity-60">(PDF, PPT, XLS, DOC)</span>
            </button>
          )}
        </div>
      )}

      {/* Descrição */}
      <div className="space-y-1">
        <Label htmlFor="description">
          {type === 'proposal' ? 'Observações' : 'Descrição'}
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            type === 'proposal'
              ? 'Detalhes sobre a proposta enviada...'
              : 'Descreva a atividade...'
          }
          rows={3}
          required
        />
      </div>

      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
        {loading
          ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Registrando...</>
          : type === 'proposal' ? 'Registrar envio de proposta' : 'Registrar atividade'
        }
      </Button>
    </form>
  )
}
