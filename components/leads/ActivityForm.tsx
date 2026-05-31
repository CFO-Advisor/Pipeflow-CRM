'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
  call: 'Ligação',
  email: 'E-mail',
  meeting: 'Reunião',
  note: 'Nota',
}

export function ActivityForm({ leadId, workspaceId, userId }: ActivityFormProps) {
  const router = useRouter()
  const [type, setType] = useState<ActivityType>('note')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return

    setLoading(true)
    const supabase = createClient()

    await supabase.from('activities').insert({
      lead_id: leadId,
      workspace_id: workspaceId,
      author_id: userId,
      type,
      description: description.trim(),
    })

    setDescription('')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(activityLabels) as [ActivityType, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva a atividade..."
          rows={3}
          required
        />
      </div>
      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrar atividade'}
      </Button>
    </form>
  )
}
