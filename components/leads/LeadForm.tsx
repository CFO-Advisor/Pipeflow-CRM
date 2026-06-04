'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2 } from 'lucide-react'
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
import type { Company, Lead } from '@/types'

interface LeadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  lead?: Lead
  planLimitReached?: boolean
  companies?: Company[]
  currentCompanyId?: string | null
}

export function LeadForm({
  open,
  onOpenChange,
  workspaceId,
  lead,
  planLimitReached,
  companies = [],
  currentCompanyId = null,
}: LeadFormProps) {
  const router = useRouter()
  const isEdit = !!lead
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: lead?.name ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    company: lead?.company ?? '',
    position: lead?.position ?? '',
  })
  const [companyId, setCompanyId] = useState<string | null>(
    lead?.company_id ?? currentCompanyId ?? null
  )
  const [photoPreview, setPhotoPreview] = useState<string | null>(lead?.photo_url ?? null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function uploadPhoto(leadId: string): Promise<string | null> {
    if (!photoFile) return photoPreview // mantém URL existente se não mudou
    setUploadingPhoto(true)
    const supabase = createClient()
    const ext = photoFile.name.split('.').pop()
    const path = `${workspaceId}/${leadId}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('lead-photos')
      .upload(path, photoFile, { upsert: true, contentType: photoFile.type })

    if (uploadErr) { setUploadingPhoto(false); return null }

    const { data } = supabase.storage.from('lead-photos').getPublicUrl(path)
    setUploadingPhoto(false)
    return data.publicUrl
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
    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      ...form,
      company_id: companyId ?? null,
    }

    if (isEdit) {
      // Upload foto se nova foi selecionada, ou remove se preview foi limpo
      const photo_url = photoFile
        ? await uploadPhoto(lead.id)
        : photoPreview // null = removida, string = mantida
      const { error: err } = await supabase
        .from('leads')
        .update({ ...payload, photo_url, updated_at: new Date().toISOString() })
        .eq('id', lead.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data: newLead, error: err } = await supabase
        .from('leads')
        .insert({ ...payload, workspace_id: workspaceId, assigned_to: user?.id ?? null })
        .select('id')
        .single()
      if (err || !newLead) { setError(err?.message ?? 'Erro ao criar lead'); setLoading(false); return }

      // Agora que temos o ID, faz upload e atualiza
      if (photoFile) {
        const photo_url = await uploadPhoto(newLead.id)
        if (photo_url) {
          await supabase.from('leads').update({ photo_url }).eq('id', newLead.id)
        }
      }
    }

    router.refresh()
    onOpenChange(false)
    setLoading(false)
  }

  const initials = form.name
    ? form.name.charAt(0).toUpperCase()
    : '?'

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
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          {/* ── Foto do lead ── */}
          <div className="flex justify-center">
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Foto do lead"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-bold text-primary">{initials}</span>
                    <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </button>

              {/* Overlay de câmera ao hover */}
              {!photoPreview && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Botão de remover foto */}
              {photoPreview && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground -mt-2">
            Clique para adicionar foto (JPG, PNG, WEBP — máx. 5 MB)
          </p>

          {/* ── Empresa do grupo (plano MAX) ── */}
          {companies.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="company_group">Empresa do grupo</Label>
              <select
                id="company_group"
                value={companyId ?? ''}
                onChange={(e) => setCompanyId(e.target.value || null)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Sem empresa vinculada</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Campos de contato ── */}
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
              <Label htmlFor="company">Empresa do contato</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => update('company', e.target.value)}
                placeholder="Nome da empresa do contato"
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" disabled={loading || uploadingPhoto}>
              {loading || uploadingPhoto
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                : isEdit ? 'Salvar' : 'Criar lead'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
