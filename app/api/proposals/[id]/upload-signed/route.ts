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
    .select('id, status, deal_id, lead_id, title, signed_by_client_at')
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
      ...(clientHadSigned && { signed_by_client_at: null }),
    })
    .eq('id', id)

  // Atualizar deal e registrar atividade apenas na primeira vez que o vendedor assina
  // (quando a proposta ainda estava em rascunho — primeiro envio real ao cliente)
  if (proposal.status === 'draft') {
    const dealId = proposal.deal_id
    let companyId: string | null = null
    let effectiveLeadId = proposal.lead_id

    if (dealId) {
      const { data: deal, error: dealFetchErr } = await service
        .from('deals')
        .select('stage, company_id, lead_id')
        .eq('id', dealId)
        .single()

      if (dealFetchErr) {
        console.error('[upload-signed] erro ao buscar deal:', dealFetchErr.message)
      }

      if (deal) {
        companyId = deal.company_id ?? null
        effectiveLeadId = effectiveLeadId ?? deal.lead_id

        const closedStages = ['closed_won', 'closed_lost']
        if (!closedStages.includes(deal.stage)) {
          const { error: stageErr } = await service
            .from('deals')
            .update({ stage: 'proposal_sent' })
            .eq('id', dealId)

          if (stageErr) {
            console.error('[upload-signed] erro ao atualizar estágio do deal:', stageErr.message)
          }
        }
      }
    }

    if (effectiveLeadId) {
      const { error: actErr } = await service.from('activities').insert({
        workspace_id: workspaceId,
        lead_id: effectiveLeadId,
        deal_id: dealId ?? null,
        company_id: companyId,
        author_id: user.id,
        type: 'proposal',
        description: `Proposta enviada: ${proposal.title}`,
        scheduled_at: new Date().toISOString().slice(0, 10),
      })

      if (actErr) {
        console.error('[upload-signed] erro ao registrar atividade:', actErr.message)
      }
    }
  }

  return NextResponse.json({
    success: true,
    path: filePath,
    clientSignatureReset: clientHadSigned,
  })
}
