'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Building2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Company } from '@/types'

interface CompanyFormProps {
  company?: Company
  trigger: React.ReactElement<{ onClick?: React.MouseEventHandler }>
}

export function CompanyForm({ company, trigger }: CompanyFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(company?.name ?? '')
  const [cnpj, setCnpj] = useState(company?.cnpj ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  // Inicializa o preview no cliente (evita mismatch SSR com blob URLs)
  useEffect(() => {
    setMounted(true)
    setLogoPreview(company?.logo_url ?? null)
  }, [])

  // Sincroniza preview quando company.logo_url muda (após router.refresh)
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(company?.logo_url ?? null)
    }
  }, [company?.logo_url])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Imagem muito grande. Máximo 5 MB.')
      return
    }
    setLogoError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLogoError('')

    try {
      const url = company ? `/api/companies/${company.id}` : '/api/companies'
      const method = company ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cnpj }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar empresa.')
        return
      }

      // Upload do logo se houver arquivo selecionado
      const savedId: string | undefined = data.id ?? company?.id
      if (logoFile && savedId) {
        const formData = new FormData()
        formData.append('file', logoFile)
        const logoRes = await fetch(`/api/companies/${savedId}/logo`, {
          method: 'POST',
          body: formData,
        })
        if (!logoRes.ok) {
          const logoData = await logoRes.json()
          setLogoError(logoData.error ?? 'Erro ao fazer upload do logo.')
          // Empresa foi salva — apenas avisa sobre o logo
        }
      }

      setOpen(false)
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      setLogoFile(null)
      setLogoError('')
    }
  }

  const triggerWithClick = React.cloneElement(trigger, {
    onClick: () => setOpen(true),
  })

  const displayLetter = (name || company?.name || 'E')[0].toUpperCase()

  return (
    <>
      {triggerWithClick}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {company ? 'Editar empresa' : 'Nova empresa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </p>
            )}

            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                  {mounted && logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">{displayLetter}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP ou SVG · máx. 5 MB</p>
              {logoError && (
                <p className="text-xs text-destructive text-center">{logoError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da empresa *</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Ltda"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-cnpj">CNPJ</Label>
              <Input
                id="company-cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
