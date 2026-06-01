'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Building2 } from 'lucide-react'
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

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
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const triggerWithClick = React.cloneElement(trigger, {
    onClick: () => setOpen(true),
  })

  return (
    <>
      {triggerWithClick}
      <Dialog open={open} onOpenChange={setOpen}>
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
                onClick={() => setOpen(false)}
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
