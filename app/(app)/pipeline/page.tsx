import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import type { DealWithLead } from '@/types'

export default async function PipelinePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const [{ data: deals }, { data: leads }] = await Promise.all([
    supabase
      .from('deals')
      .select('*, lead:leads(id, name, company)')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true }),
    supabase
      .from('leads')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pipeline de Vendas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Arraste os cards para mover entre etapas
        </p>
      </div>

      <KanbanBoard
        deals={(deals ?? []) as DealWithLead[]}
        workspaceId={workspaceId}
        leads={leads ?? []}
      />
    </div>
  )
}
