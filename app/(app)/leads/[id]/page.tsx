import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Building2, Mail, Phone, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LeadDealPanel } from '@/components/leads/LeadDealPanel'
import { LeadActivityPanel } from '@/components/leads/LeadActivityPanel'
import { formatDate } from '@/lib/utils'
import type { ActivityWithAuthor, BusinessUnit, Deal } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value

  const [{ data: lead }, { data: rawActivities }, { data: rawDeals }, { data: rawBUs }] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId ?? '')
      .single(),
    supabase
      .from('activities')
      .select('*')
      .eq('lead_id', id)
      .order('scheduled_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('deals')
      .select('*')
      .eq('lead_id', id)
      .eq('workspace_id', workspaceId ?? '')
      .order('created_at', { ascending: false }),
    supabase
      .from('business_units')
      .select('*')
      .eq('workspace_id', workspaceId ?? '')
      .eq('active', true)
      .order('name'),
  ])

  if (!lead) notFound()

  // Enriquecer atividades com dados do autor via admin API
  const rawActList = rawActivities ?? []
  const authorIds = [...new Set(rawActList.map((a: any) => a.author_id).filter(Boolean))]
  let authorMap = new Map<string, { email: string; name?: string }>()

  if (authorIds.length > 0) {
    const service = createServiceClient()
    const { data: authData } = await service.auth.admin.listUsers({ perPage: 1000 })
    authorMap = new Map(
      (authData?.users ?? [])
        .filter(u => authorIds.includes(u.id))
        .map(u => [u.id, { email: u.email ?? '', name: u.user_metadata?.full_name as string | undefined }])
    )
  }

  const activities: ActivityWithAuthor[] = rawActList.map((a: any) => {
    const info = a.author_id ? authorMap.get(a.author_id) : undefined
    return {
      ...a,
      author: info
        ? { id: a.author_id, email: info.email, user_metadata: { full_name: info.name } }
        : null,
    }
  })

  const deals = (rawDeals ?? []) as Deal[]
  const businessUnits = (rawBUs ?? []) as BusinessUnit[]

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/leads"
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-muted"
          aria-label="Voltar para Leads"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Avatar / foto */}
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
          {lead.photo_url ? (
            <img src={lead.photo_url} alt={lead.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-lg">
              {lead.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight flex-1 min-w-0 truncate">{lead.name}</h1>
        <Badge variant="outline">{lead.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-150 group">
                <Mail className="w-4 h-4 group-hover:text-primary transition-colors duration-150" />
                {lead.email}
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-150 group">
                <Phone className="w-4 h-4 group-hover:text-primary transition-colors duration-150" />
                {lead.phone}
              </a>
            )}
            {lead.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                {lead.company}
              </div>
            )}
            {lead.position && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                {lead.position}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Criado em {formatDate(lead.created_at)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negócios</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadDealPanel
            leadId={lead.id}
            workspaceId={workspaceId ?? lead.workspace_id}
            companyId={lead.company_id}
            deals={deals}
            businessUnits={businessUnits}
          />
        </CardContent>
      </Card>

      <LeadActivityPanel
        leadId={lead.id}
        workspaceId={workspaceId ?? lead.workspace_id}
        userId={user.id}
        deals={deals}
        activities={activities}
        leadEmail={lead.email}
        leadPhone={lead.phone}
        leadName={lead.name}
      />
    </div>
  )
}
