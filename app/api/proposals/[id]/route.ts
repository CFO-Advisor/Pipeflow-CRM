import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function getWorkspaceAndProposal(proposalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.', status: 401 }

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return { error: 'Workspace não encontrado.', status: 400 }

  const service = createServiceClient()
  const { data: proposal } = await service
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!proposal) return { error: 'Proposta não encontrada.', status: 404 }

  return { user, workspaceId, service, proposal }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getWorkspaceAndProposal(id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const { service } = result
  const { data, error } = await service
    .from('proposals')
    .select('*, items:proposal_items(*)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getWorkspaceAndProposal(id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const { service } = result
  const body = await req.json()
  const { title, description, valid_until, notes, status, items, signed_by_seller_at, signed_by_client_at, pdf_path, signed_pdf_path } = body

  // Calcular total_value se itens fornecidos
  let totalValue: number | undefined
  if (items) {
    totalValue = items.reduce((sum: number, i: { quantity: number; unit_price: number }) => sum + (i.quantity * i.unit_price), 0)
  }

  const { data: updated, error } = await service
    .from('proposals')
    .update({
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(valid_until !== undefined && { valid_until: valid_until || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(totalValue !== undefined && { total_value: totalValue }),
      ...(signed_by_seller_at !== undefined && { signed_by_seller_at }),
      ...(signed_by_client_at !== undefined && { signed_by_client_at }),
      ...(pdf_path !== undefined && { pdf_path }),
      ...(signed_pdf_path !== undefined && { signed_pdf_path }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registrar atividade no lead quando proposta é marcada como enviada
  if (status === 'sent' && result.proposal.status !== 'sent' && result.proposal.lead_id) {
    await service.from('activities').insert({
      workspace_id: result.workspaceId,
      lead_id: result.proposal.lead_id,
      company_id: result.proposal.deal_id
        ? (await service.from('deals').select('company_id').eq('id', result.proposal.deal_id).single()).data?.company_id ?? null
        : null,
      author_id: result.user.id,
      type: 'proposal',
      description: `Proposta enviada: ${updated.title}`,
    })
  }

  // Substituir itens se fornecidos
  if (items) {
    await service.from('proposal_items').delete().eq('proposal_id', id)
    if (items.length > 0) {
      await service.from('proposal_items').insert(
        items.map((item: { description: string; quantity: number; unit_price: number }, idx: number) => ({
          proposal_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          position: idx,
        }))
      )
    }
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getWorkspaceAndProposal(id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const { service } = result
  const { error } = await service.from('proposals').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
