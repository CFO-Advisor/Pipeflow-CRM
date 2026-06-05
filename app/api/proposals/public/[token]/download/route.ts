import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_STATUSES = ['sent', 'awaiting_signature', 'signed']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const service = createServiceClient()

  const { data: proposal } = await service
    .from('proposals')
    .select('id, status, signed_pdf_path, title')
    .eq('public_token', token)
    .single()

  if (!proposal) return new NextResponse('Proposta não encontrada.', { status: 404 })

  // Bloquear acesso se proposta não está em status que permite download
  if (!ALLOWED_STATUSES.includes(proposal.status)) {
    return new NextResponse('Acesso não permitido.', { status: 403 })
  }

  if (!proposal.signed_pdf_path) {
    return new NextResponse('PDF do vendedor ainda não disponível.', { status: 404 })
  }

  const { data, error } = await service.storage
    .from('deal-attachments')
    .download(proposal.signed_pdf_path)

  if (error || !data) return new NextResponse('Erro ao obter PDF.', { status: 500 })

  const buffer = await data.arrayBuffer()
  const filename = `proposta-${proposal.id.slice(0, 8)}-para-assinar.pdf`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
