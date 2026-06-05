import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _req: NextRequest,
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
    .select('signed_pdf_path, title')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!proposal?.signed_pdf_path) {
    return NextResponse.json({ error: 'PDF assinado não encontrado.' }, { status: 404 })
  }

  const { data, error } = await service.storage
    .from('deal-attachments')
    .createSignedUrl(proposal.signed_pdf_path, 300) // 5 min

  if (error || !data) return NextResponse.json({ error: 'Erro ao gerar link.' }, { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
