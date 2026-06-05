'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BusinessUnit } from '@/types'

interface BusinessUnitFormProps {
  companyId: string
  businessUnit?: BusinessUnit
  trigger: React.ReactElement<{ onClick?: React.MouseEventHandler }>
}

export function BusinessUnitForm({ companyId, businessUnit, trigger }: BusinessUnitFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(businessUnit?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = businessUnit ? `/api/business-units/${businessUnit.id}` : '/api/business-units'
      const method = businessUnit ? 'PATCH' : 'POST'
      const body = businessUnit ? { name } : { name, company_id: companyId }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar.')
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
              <Layers className="w-5 h-5" />
              {businessUnit ? 'Editar unidade de negócio' : 'Nova unidade de negócio'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="bu-name">Nome da unidade *</Label>
              <Input
                id="bu-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Comercial Sul, Varejo, TI..."
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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
