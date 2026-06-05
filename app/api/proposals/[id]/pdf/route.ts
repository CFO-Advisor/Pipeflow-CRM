import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { renderToBuffer } from '@react-pdf/renderer'
import { ProposalPDF } from '@/lib/pdf/proposal-pdf'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const service = createServiceClient()

  const { data: proposal } = await service
    .from('proposals')
    .select('*, items:proposal_items(*)')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  const [{ data: workspace }, { data: deal }] = await Promise.all([
    service.from('workspaces').select('name').eq('id', workspaceId).single(),
    service.from('deals').select('company:companies(logo_url)').eq('id', proposal.deal_id).single(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyLogoUrl: string | null = (deal?.company as any)?.logo_url ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(ProposalPDF as any, {
      proposal: { ...proposal, items: proposal.items ?? [] },
      workspaceName: workspace?.name,
      companyLogoUrl,
    }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="proposta-${id.slice(0, 8)}.pdf"`,
    },
  })
}
