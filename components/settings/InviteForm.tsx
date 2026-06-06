'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Company } from '@/types'

interface InviteFormProps {
  workspaceId: string
  disabled?: boolean
  isMax?: boolean
  companies?: Company[]
}

export function InviteForm({ workspaceId, disabled, isMax, companies = [] }: InviteFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function toggleCompany(id: string) {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, workspaceId,
          ...(isMax && companies.length > 0 ? { companyIds: selectedCompanyIds } : {}),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Erro ao cadastrar colaborador.' })
      } else {
        setMessage({ type: 'success', text: `${name} cadastrado. Repasse as credenciais ao colaborador.` })
        setName('')
        setEmail('')
        setPassword('')
        setSelectedCompanyIds([])
        router.refresh()
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {message && (
        <div
          className={`text-sm rounded-md p-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="member-name">Nome completo</Label>
          <Input
            id="member-name"
            type="text"
            placeholder="João da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-email">E-mail</Label>
          <Input
            id="member-email"
            type="email"
            placeholder="colaborador@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="member-password">Senha temporária</Label>
        <Input
          id="member-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={disabled}
          minLength={6}
          required
        />
        <p className="text-xs text-muted-foreground">
          O colaborador precisará trocar a senha no primeiro acesso.
        </p>
      </div>
      {isMax && companies.length > 0 && (
        <div className="space-y-1.5">
          <Label>Acesso a empresas</Label>
          <div className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
            {companies.map((company) => (
              <label
                key={company.id}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/50 select-none"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-blue-600"
                  checked={selectedCompanyIds.includes(company.id)}
                  onChange={() => toggleCompany(company.id)}
                  disabled={disabled}
                />
                <span className="text-sm">{company.name}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Deixe em branco para configurar o acesso depois.
          </p>
        </div>
      )}
      <Button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        disabled={loading || disabled}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {loading ? 'Cadastrando...' : 'Adicionar colaborador'}
      </Button>
      {disabled && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2">
          Limite de 2 colaboradores do plano Free atingido. Faça upgrade para Pro para adicionar mais.
        </p>
      )}
    </form>
  )
}
