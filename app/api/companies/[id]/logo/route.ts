import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

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

  // Verificar se a empresa pertence ao workspace e se o usuário tem permissão
  const { data: company } = await service
    .from('companies')
    .select('id, workspace_id, logo_url')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

  const { data: member } = await service
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  const allowed = member?.role === 'admin' || member?.sales_role === 'master'
  if (!allowed) return NextResponse.json({ error: 'Apenas admin ou master pode alterar o logo.' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG, WebP ou SVG.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5 MB.' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'png'
  const filePath = `${workspaceId}/${id}.${ext}`

  // Remover logo anterior se existir (extensão pode ser diferente)
  if (company.logo_url) {
    const oldPath = company.logo_url.split('/company-logos/')[1]
    if (oldPath) {
      await service.storage.from('company-logos').remove([oldPath])
    }
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadErr } = await service.storage
    .from('company-logos')
    .upload(filePath, buffer, { contentType: file.type, upsert: true })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = service.storage.from('company-logos').getPublicUrl(filePath)
  const logoUrl = urlData.publicUrl

  await service.from('companies').update({ logo_url: logoUrl }).eq('id', id)

  return NextResponse.json({ logo_url: logoUrl })
}

export async function DELETE(
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

  const { data: company } = await service
    .from('companies')
    .select('id, workspace_id, logo_url')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

  const { data: member } = await service
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  const allowed = member?.role === 'admin' || member?.sales_role === 'master'
  if (!allowed) return NextResponse.json({ error: 'Apenas admin ou master pode remover o logo.' }, { status: 403 })

  if (company.logo_url) {
    const oldPath = company.logo_url.split('/company-logos/')[1]
    if (oldPath) {
      await service.storage.from('company-logos').remove([oldPath])
    }
  }

  await service.from('companies').update({ logo_url: null }).eq('id', id)

  return NextResponse.json({ success: true })
}
