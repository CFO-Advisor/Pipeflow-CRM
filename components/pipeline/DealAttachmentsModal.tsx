'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Upload,
  Trash2,
  Download,
  Paperclip,
  Loader2,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { AttachmentCategory, DealAttachment, DealWithLead } from '@/types'

const CATEGORIES: {
  key: AttachmentCategory
  label: string
  icon: React.ReactNode
  description: string
}[] = [
  {
    key: 'proposta',
    label: 'Proposta',
    icon: <FileText className="w-4 h-4" />,
    description: 'Propostas comerciais enviadas ao cliente',
  },
  {
    key: 'cotacao',
    label: 'Cotação',
    icon: <FileSpreadsheet className="w-4 h-4" />,
    description: 'Planilhas de preços e cotações',
  },
  {
    key: 'apresentacao',
    label: 'Apresentação',
    icon: <Presentation className="w-4 h-4" />,
    description: 'Slides e apresentações enviadas',
  },
]

const ACCEPT = '.pdf,.ppt,.pptx,.xls,.xlsx,.eml,.msg'

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mime: string | null) {
  if (!mime) return <FileText className="w-4 h-4 text-muted-foreground" />
  if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />
  if (mime.includes('sheet') || mime.includes('excel'))
    return <FileSpreadsheet className="w-4 h-4 text-green-600" />
  if (mime.includes('presentation') || mime.includes('powerpoint'))
    return <Presentation className="w-4 h-4 text-orange-500" />
  return <Paperclip className="w-4 h-4 text-muted-foreground" />
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal: DealWithLead
  workspaceId: string
}

export function DealAttachmentsModal({ open, onOpenChange, deal, workspaceId }: Props) {
  const [activeCategory, setActiveCategory] = useState<AttachmentCategory>('proposta')
  const [attachments, setAttachments] = useState<DealAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteAttachment, setConfirmDeleteAttachment] = useState<DealAttachment | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) fetchAttachments()
  }, [open])

  async function fetchAttachments() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('deal_attachments')
      .select('*')
      .eq('deal_id', deal.id)
      .order('created_at', { ascending: false })
    setAttachments((data ?? []) as DealAttachment[])
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    if (!file) return

    setUploading(true)
    setError('')
    const supabase = createClient()

    const ext = file.name.split('.').pop()
    const safeName = `${Date.now()}.${ext}`
    const filePath = `${workspaceId}/${deal.id}/${activeCategory}/${safeName}`

    const { error: uploadErr } = await supabase.storage
      .from('deal-attachments')
      .upload(filePath, file, { contentType: file.type })

    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: dbErr } = await supabase.from('deal_attachments').insert({
      deal_id: deal.id,
      workspace_id: workspaceId,
      category: activeCategory,
      name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      created_by: user?.id ?? null,
    })

    if (dbErr) {
      setError(dbErr.message)
      await supabase.storage.from('deal-attachments').remove([filePath])
    } else {
      await fetchAttachments()
    }

    setUploading(false)
  }

  async function handleDeleteConfirmed() {
    const attachment = confirmDeleteAttachment
    if (!attachment) return
    setDeletingId(attachment.id)
    const supabase = createClient()

    await supabase.storage.from('deal-attachments').remove([attachment.file_path])
    await supabase.from('deal_attachments').delete().eq('id', attachment.id)

    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
    setDeletingId(null)
  }

  async function handleDownload(attachment: DealAttachment) {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('deal-attachments')
      .createSignedUrl(attachment.file_path, 60)

    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = attachment.name
      a.click()
    }
  }

  const byCategory = attachments.filter((a) => a.category === activeCategory)
  const totalCount = attachments.length

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Anexos — {deal.title}
          </DialogTitle>
          <DialogDescription>
            {totalCount > 0
              ? `${totalCount} arquivo${totalCount !== 1 ? 's' : ''} anexado${totalCount !== 1 ? 's' : ''}`
              : 'Nenhum arquivo anexado ainda'}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs de categoria */}
        <div className="flex gap-1 border-b border-border pb-0">
          {CATEGORIES.map((cat) => {
            const count = attachments.filter((a) => a.category === cat.key).length
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeCategory === cat.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.icon}
                {cat.label}
                {count > 0 && (
                  <span className="ml-0.5 bg-primary/15 text-primary text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-3 min-h-[200px]">
          {/* Descrição da categoria */}
          <p className="text-xs text-muted-foreground">
            {CATEGORIES.find((c) => c.key === activeCategory)?.description}
          </p>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          {/* Botão de upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 transition-colors py-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {uploading ? 'Enviando...' : 'Clique para anexar um arquivo'}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                PDF, PPT, PPTX, XLS, XLSX, EML — máx. 50 MB
              </span>
            </button>
          </div>

          {/* Lista de arquivos */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : byCategory.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              Nenhum arquivo nesta categoria ainda.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {byCategory.map((att) => (
                <li
                  key={att.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  {fileIcon(att.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(att.file_size)}
                      {att.created_at && (
                        <> · {new Date(att.created_at).toLocaleDateString('pt-BR')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-blue-600"
                      onClick={() => handleDownload(att)}
                      title="Baixar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-red-600"
                      onClick={() => setConfirmDeleteAttachment(att)}
                      disabled={deletingId === att.id}
                      title="Excluir"
                    >
                      {deletingId === att.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={!!confirmDeleteAttachment}
      onOpenChange={(open) => { if (!open) setConfirmDeleteAttachment(null) }}
      title="Excluir anexo"
      description={confirmDeleteAttachment ? `"${confirmDeleteAttachment.name}" será excluído permanentemente.` : undefined}
      confirmLabel="Excluir"
      onConfirm={handleDeleteConfirmed}
    />
    </>
  )
}
