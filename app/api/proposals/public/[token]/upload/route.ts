import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

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

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Apenas PDFs são aceitos.' }, { status: 400 })

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
