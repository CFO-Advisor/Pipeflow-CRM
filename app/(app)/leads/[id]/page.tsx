import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Building2, Mail, Phone, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ActivityTimeline } from '@/components/leads/ActivityTimeline'
import { ActivityForm } from '@/components/leads/ActivityForm'
import { formatDate } from '@/lib/utils'
import type { ActivityWithAuthor } from '@/types'

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

  const [{ data: lead }, { data: rawActivities }] = await Promise.all([
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
      .order('created_at', { ascending: false }),
  ])

  if (!lead) notFound()

  const activities = (rawActivities ?? []) as ActivityWithAuthor[]

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leads" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
        <Badge variant="outline">{lead.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {lead.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                {lead.email}
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {lead.phone}
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                {lead.company}
              </div>
            )}
            {lead.position && (
              <div className="flex items-center gap-2 text-slate-600">
                <Briefcase className="w-4 h-4 text-slate-400" />
                {lead.position}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Criado em {formatDate(lead.created_at)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrar atividade</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm
            leadId={lead.id}
            workspaceId={workspaceId ?? lead.workspace_id}
            userId={user.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Histórico de atividades
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({activities.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={activities} />
        </CardContent>
      </Card>
    </div>
  )
}
