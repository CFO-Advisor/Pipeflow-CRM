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
  leadEmail?: string | null
  leadPhone?: string | null
  leadName?: string
}

const activityLabels: Record<ActivityType, string> = {
  call:     'Ligação',
  email:    'E-mail',
  meeting:  'Reunião',
  note:     'Nota',
  proposal: 'Envio de Proposta',
  whatsapp: 'WhatsApp',
}

const ACCEPT_PROPOSAL = '.pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function buildWhatsAppUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '')
  // Adiciona código do Brasil se não tiver DDI
  const number = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export function ActivityForm({
  leadId,
  workspaceId,
  userId,
  leadEmail,
  leadPhone,
  leadName,
}: ActivityFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<ActivityType>('note')
  const [description, setDescription] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [scheduledAt, setScheduledAt] = useState(() => new Date().toISOString().slice(0, 10))
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
    if (!scheduledAt) {
      setError('Informe a data da atividade.')
      return
    }
    if (type === 'proposal' && !proposalFile) {
      setError('Anexe o arquivo da proposta.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    // 1. Inserir atividade
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

    // 2. Upload da proposta (se houver)
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

      await supabase
        .from('activities')
        .update({ attachment_url: urlData.publicUrl, attachment_name: proposalFile.name })
        .eq('id', newActivity.id)
    }

    // 3. Abrir cliente de e-mail (Outlook) com destinatário, assunto e corpo preenchidos
    if (type === 'email' && leadEmail) {
      const subject = emailSubject.trim() || `Mensagem para ${leadName ?? leadEmail}`
      const mailto = `mailto:${encodeURIComponent(leadEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(description.trim())}`
      window.open(mailto, '_blank')
    }

    // 4. Abrir WhatsApp
    if (type === 'whatsapp' && leadPhone) {
      window.open(buildWhatsAppUrl(leadPhone, description.trim()), '_blank', 'noopener,noreferrer')
    }

    setDescription('')
    setEmailSubject('')
    setScheduledAt(new Date().toISOString().slice(0, 10))
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
              <SelectValue>{activityLabels[type]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(activityLabels) as [ActivityType, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value} label={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data da atividade */}
        <div>
          <Label htmlFor="scheduled_at" className="mb-1.5 block">
            Data da atividade <span className="text-destructive">*</span>
          </Label>
          <Input
            id="scheduled_at"
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-44"
            required
          />
        </div>
      </div>

      {/* Aviso: sem e-mail cadastrado */}
      {type === 'email' && !leadEmail && (
        <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          Este lead não tem e-mail cadastrado. A atividade será registrada, mas o e-mail não será enviado.
        </div>
      )}

      {/* Assunto do e-mail */}
      {type === 'email' && leadEmail && (
        <div className="space-y-1">
          <Label htmlFor="email_subject">
            Assunto <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
          </Label>
          <Input
            id="email_subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder={`Mensagem para ${leadName ?? leadEmail}`}
          />
        </div>
      )}

      {/* Aviso: sem telefone cadastrado */}
      {type === 'whatsapp' && !leadPhone && (
        <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          Este lead não tem telefone cadastrado. A atividade será registrada, mas o WhatsApp não será aberto.
        </div>
      )}

      {/* Upload de proposta */}
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
          {type === 'proposal' ? 'Observações' : type === 'whatsapp' ? 'Mensagem' : 'Descrição'}
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            type === 'proposal'
              ? 'Detalhes sobre a proposta enviada...'
              : type === 'whatsapp'
              ? 'Digite a mensagem que será enviada pelo WhatsApp...'
              : type === 'email'
              ? 'Corpo do e-mail a ser enviado...'
              : 'Descreva a atividade...'
          }
          rows={3}
          required
        />
      </div>

      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
        {loading ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Registrando...</>
        ) : type === 'proposal' ? 'Registrar envio de proposta'
          : type === 'email' && leadEmail ? 'Registrar e abrir Outlook'
          : type === 'whatsapp' && leadPhone ? 'Registrar e abrir WhatsApp'
          : 'Registrar atividade'}
      </Button>
    </form>
  )
}
