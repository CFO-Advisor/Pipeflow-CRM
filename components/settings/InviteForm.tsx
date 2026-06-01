'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InviteFormProps {
  workspaceId: string
  disabled?: boolean
}

export function InviteForm({ workspaceId, disabled }: InviteFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, workspaceId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error ?? 'Erro ao enviar convite.' })
    } else {
      setMessage({ type: 'success', text: `Convite enviado para ${email}` })
      setEmail('')
      router.refresh()
    }

    setLoading(false)
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
      <div className="space-y-2">
        <Label htmlFor="invite-email">E-mail do colaborador</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="invite-email"
            type="email"
            placeholder="colaborador@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
            required
            className="flex-1"
          />
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 sm:flex-shrink-0"
            disabled={loading || disabled}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {loading ? 'Enviando...' : 'Convidar'}
          </Button>
        </div>
      </div>
      {disabled && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2">
          Limite de 2 colaboradores do plano Free atingido. Faça upgrade para Pro para convidar mais.
        </p>
      )}
    </form>
  )
}
