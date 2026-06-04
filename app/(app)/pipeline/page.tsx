import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { createServiceClient } from '@/lib/supabase/service'
import type { BusinessUnit, DealWithLead } from '@/types'

export default async function PipelinePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  // Filtro de empresa para plano MAX (RLS já garante segurança; cookie é apenas UX)
  const companyId =
    workspace?.plan === 'max'
      ? (cookieStore.get('current_company_id')?.value ?? null)
      : null

  const businessUnitId =
    workspace?.plan === 'max'
      ? (cookieStore.get('current_business_unit_id')?.value ?? null)
      : null

  let dealsQuery = supabase
    .from('deals')
    .select('*, lead:leads(id, name, company), company:companies(id, name)')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true })

  let leadsQuery = supabase
    .from('leads')
    .select('id, name')
    .eq('workspace_id', workspaceId)
    .order('name')

  if (companyId) {
    dealsQuery = dealsQuery.eq('company_id', companyId)
    leadsQuery = leadsQuery.eq('company_id', companyId)
  }

  if (businessUnitId) {
    dealsQuery = dealsQuery.eq('business_unit_id', businessUnitId)
    leadsQuery = leadsQuery.eq('business_unit_id', businessUnitId)
  }

  const service = createServiceClient()
  const [{ data: deals }, { data: leads }, { data: busData }] = await Promise.all([
    dealsQuery,
    leadsQuery,
    service.from('business_units').select('*').eq('workspace_id', workspaceId).eq('active', true).order('name'),
  ])
  const businessUnits = (busData ?? []) as BusinessUnit[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Pipeline de Vendas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Arraste os cards para mover entre etapas
        </p>
      </div>

      <div className="-mx-4 lg:mx-0 px-4 lg:px-0">
        <KanbanBoard
          deals={(deals ?? []) as DealWithLead[]}
          workspaceId={workspaceId}
          leads={leads ?? []}
          companyId={companyId}
          businessUnits={businessUnits}
        />
      </div>
    </div>
  )
}
