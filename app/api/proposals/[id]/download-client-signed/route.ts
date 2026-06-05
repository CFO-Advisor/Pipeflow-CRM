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
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  const filePath = `proposals/${id}/client-signed.pdf`

  const { data, error } = await service.storage
    .from('deal-attachments')
    .createSignedUrl(filePath, 300)

  if (error || !data) return NextResponse.json({ error: 'PDF do cliente não encontrado.' }, { status: 404 })

  return NextResponse.redirect(data.signedUrl)
}
