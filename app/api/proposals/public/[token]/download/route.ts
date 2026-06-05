import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const service = createServiceClient()

  const { data: proposal } = await service
    .from('proposals')
    .select('id, signed_pdf_path')
    .eq('public_token', token)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  // Usar PDF assinado pelo vendedor se disponível, senão redirecionar para o PDF original
  const path = proposal.signed_pdf_path
  if (!path) {
    return NextResponse.json({ error: 'PDF do vendedor ainda não disponível.' }, { status: 404 })
  }

  const { data, error } = await service.storage
    .from('deal-attachments')
    .createSignedUrl(path, 300)

  if (error || !data) return NextResponse.json({ error: 'Erro ao gerar link.' }, { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
