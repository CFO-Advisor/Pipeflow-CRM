import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const UPLOAD_ALLOWED_STATUSES = ['sent', 'awaiting_signature']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const service = createServiceClient()

  const { data: proposal } = await service
    .from('proposals')
    .select('id, status, signed_pdf_path, valid_until')
    .eq('public_token', token)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  // Bloquear upload se status não permite
  if (!UPLOAD_ALLOWED_STATUSES.includes(proposal.status)) {
    return NextResponse.json({ error: 'Esta proposta não está disponível para assinatura.' }, { status: 403 })
  }

  // Bloquear se expirada
  if (proposal.valid_until && new Date(proposal.valid_until) < new Date()) {
    await service.from('proposals').update({ status: 'expired' }).eq('id', proposal.id)
    return NextResponse.json({ error: 'Esta proposta está expirada.' }, { status: 403 })
  }

  // Exigir que o vendedor já tenha enviado o PDF assinado
  if (!proposal.signed_pdf_path) {
    return NextResponse.json({ error: 'O vendedor ainda não enviou o PDF assinado.' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Apenas PDFs são aceitos.' }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Arquivo muito grande (máx. 20MB).' }, { status: 400 })

  const filePath = `proposals/${proposal.id}/client-signed.pdf`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadErr } = await service.storage
    .from('deal-attachments')
    .upload(filePath, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  await service
    .from('proposals')
    .update({
      signed_by_client_at: new Date().toISOString(),
      status: 'signed',
    })
    .eq('id', proposal.id)

  return NextResponse.json({ success: true })
}
