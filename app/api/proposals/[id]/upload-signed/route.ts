import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  req: NextRequest,
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
    .select('id, signed_by_client_at')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Apenas PDFs são aceitos.' }, { status: 400 })

  const filePath = `proposals/${id}/vendor-signed.pdf`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadErr } = await service.storage
    .from('deal-attachments')
    .upload(filePath, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  // Se o cliente já havia assinado, invalidar a assinatura dele pois o documento mudou
  const clientHadSigned = !!proposal.signed_by_client_at
  if (clientHadSigned) {
    // Remover o PDF antigo do cliente do storage
    await service.storage
      .from('deal-attachments')
      .remove([`proposals/${id}/client-signed.pdf`])
  }

  await service
    .from('proposals')
    .update({
      signed_pdf_path: filePath,
      signed_by_seller_at: new Date().toISOString(),
      status: 'awaiting_signature',
      // Resetar assinatura do cliente se ele já havia assinado
      ...(clientHadSigned && {
        signed_by_client_at: null,
      }),
    })
    .eq('id', id)

  return NextResponse.json({
    success: true,
    path: filePath,
    clientSignatureReset: clientHadSigned,
  })
}
