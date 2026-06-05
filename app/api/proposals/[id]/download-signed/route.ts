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
  if (!user) return new NextResponse('Não autorizado.', { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return new NextResponse('Workspace não encontrado.', { status: 400 })

  const service = createServiceClient()
  const { data: proposal } = await service
    .from('proposals')
    .select('signed_pdf_path, title')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!proposal?.signed_pdf_path) {
    return new NextResponse('PDF assinado não encontrado.', { status: 404 })
  }

  const { data, error } = await service.storage
    .from('deal-attachments')
    .download(proposal.signed_pdf_path)

  if (error || !data) return new NextResponse('Erro ao obter PDF.', { status: 500 })

  const buffer = await data.arrayBuffer()
  const filename = `proposta-${id.slice(0, 8)}-vendedor-assinado.pdf`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
