import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('proposals')
    .select('*, items:proposal_items(*)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const body = await req.json()
  const { deal_id, lead_id, title, description, valid_until, notes, items = [], template_id } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 })
  if (!deal_id) return NextResponse.json({ error: 'Deal é obrigatório.' }, { status: 400 })

  const service = createServiceClient()

  // Verificar que o deal pertence ao workspace e buscar lead_id automaticamente
  const { data: deal } = await service.from('deals').select('id, lead_id, company_id').eq('id', deal_id).eq('workspace_id', workspaceId).single()
  if (!deal) return NextResponse.json({ error: 'Deal não encontrado.' }, { status: 404 })

  // Usar lead_id do deal se não foi informado explicitamente
  const resolvedLeadId = lead_id || deal.lead_id || null

  // Buscar itens do template se fornecido
  let templateItems = items
  if (template_id && items.length === 0) {
    const { data: tmpl } = await service.from('proposal_templates').select('items').eq('id', template_id).eq('workspace_id', workspaceId).single()
    if (tmpl) templateItems = tmpl.items
  }

  const totalValue = templateItems.reduce((sum: number, i: { quantity: number; unit_price: number }) => sum + (i.quantity * i.unit_price), 0)

  const { data: proposal, error } = await service
    .from('proposals')
    .insert({
      workspace_id: workspaceId,
      deal_id,
      lead_id: resolvedLeadId,
      title: title.trim(),
      description: description?.trim() || null,
      valid_until: valid_until || null,
      notes: notes?.trim() || null,
      total_value: totalValue,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registrar atividade de proposta criada no lead
  if (resolvedLeadId) {
    await service.from('activities').insert({
      workspace_id: workspaceId,
      lead_id: resolvedLeadId,
      company_id: deal.company_id ?? null,
      author_id: user.id,
      type: 'proposal',
      description: `Proposta criada: ${title.trim()}`,
    })
  }

  // Inserir itens
  if (templateItems.length > 0) {
    const itemRows = templateItems.map((item: { description: string; quantity: number; unit_price: number }, idx: number) => ({
      proposal_id: proposal.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position: idx,
    }))
    await service.from('proposal_items').insert(itemRows)
  }

  const { data: full } = await service.from('proposals').select('*, items:proposal_items(*)').eq('id', proposal.id).single()
  return NextResponse.json(full, { status: 201 })
}
