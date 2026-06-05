import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

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

  // Retornar apenas campos necessários para visualização pública
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
    pdf_path: data.pdf_path,
    signed_pdf_path: data.signed_pdf_path,
    items: data.items,
    created_at: data.created_at,
  })
}

// Aceite pelo cliente
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const service = createServiceClient()

  const { data: proposal } = await service
    .from('proposals')
    .select('id, status')
    .eq('public_token', token)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
  if (proposal.status === 'signed') return NextResponse.json({ error: 'Proposta já assinada.' }, { status: 400 })

  const { action } = await req.json()

  if (action === 'accept') {
    await service.from('proposals').update({
      signed_by_client_at: new Date().toISOString(),
      status: 'signed',
    }).eq('id', proposal.id)
    return NextResponse.json({ success: true, status: 'signed' })
  }

  if (action === 'reject') {
    await service.from('proposals').update({ status: 'rejected' }).eq('id', proposal.id)
    return NextResponse.json({ success: true, status: 'rejected' })
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
}
