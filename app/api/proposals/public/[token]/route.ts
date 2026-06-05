import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const PUBLIC_ALLOWED_STATUSES = ['sent', 'awaiting_signature', 'signed', 'rejected']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('proposals')
    .select('*, items:proposal_items(*)')
    .eq('public_token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  // Bloquear acesso a drafts
  if (!PUBLIC_ALLOWED_STATUSES.includes(data.status)) {
    return NextResponse.json({ error: 'Proposta não disponível.' }, { status: 403 })
  }

  // Retornar apenas campos necessários — nunca expor caminhos de storage
  return NextResponse.json({
    id: data.id,
    title: data.title,
    description: data.description,
    valid_until: data.valid_until,
    status: data.status,
    total_value: data.total_value,
    notes: data.notes,
    signed_by_seller_at: data.signed_by_seller_at,
    signed_by_client_at: data.signed_by_client_at,
    has_vendor_pdf: !!data.signed_pdf_path,   // boolean, não o path
    items: data.items,
    created_at: data.created_at,
  })
}

// Rejeitar proposta pelo cliente
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const service = createServiceClient()

  const { data: proposal } = await service
    .from('proposals')
    .select('id, status, valid_until')
    .eq('public_token', token)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  if (!PUBLIC_ALLOWED_STATUSES.includes(proposal.status)) {
    return NextResponse.json({ error: 'Proposta não disponível.' }, { status: 403 })
  }

  if (proposal.status === 'signed') return NextResponse.json({ error: 'Proposta já assinada.' }, { status: 400 })

  if (proposal.valid_until && new Date(proposal.valid_until) < new Date()) {
    await service.from('proposals').update({ status: 'expired' }).eq('id', proposal.id)
    return NextResponse.json({ error: 'Esta proposta está expirada.' }, { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  if (action === 'reject') {
    await service.from('proposals').update({ status: 'rejected' }).eq('id', proposal.id)
    return NextResponse.json({ success: true, status: 'rejected' })
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
}
