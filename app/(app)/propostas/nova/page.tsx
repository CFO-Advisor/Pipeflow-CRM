import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PropostaForm } from '@/components/propostas/PropostaForm'
import type { ProposalTemplate } from '@/types'

export default async function NovaPropostaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const service = createServiceClient()
  const [{ data: dealsData }, { data: templatesData }] = await Promise.all([
    service.from('deals').select('id, title, lead:leads(name, company)').eq('workspace_id', workspaceId).not('stage', 'in', '("closed_lost")').order('created_at', { ascending: false }),
    service.from('proposal_templates').select('*').eq('workspace_id', workspaceId).order('name'),
  ])

  const deals = (dealsData ?? []).map(d => {
    const lead = Array.isArray(d.lead) ? d.lead[0] : d.lead
    return { id: d.id, title: d.title, leadName: lead?.name ?? null, company: lead?.company ?? null }
  })
  const templates = (templatesData ?? []) as ProposalTemplate[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/propostas" className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Nova Proposta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crie uma proposta vinculada a um negócio</p>
        </div>
      </div>
      <PropostaForm deals={deals} templates={templates} />
    </div>
  )
}
