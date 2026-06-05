import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const service = createServiceClient()

  // Verificar que a BU pertence ao workspace
  const { data: bu } = await service
    .from('business_units')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!bu) return NextResponse.json({ error: 'Unidade não encontrada.' }, { status: 404 })

  const { name, active } = await req.json()

  const { data: updated, error } = await service
    .from('business_units')
    .update({
      ...(name !== undefined && { name: name.trim() }),
      ...(active !== undefined && { active }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const service = createServiceClient()

  const { data: bu } = await service
    .from('business_units')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!bu) return NextResponse.json({ error: 'Unidade não encontrada.' }, { status: 404 })

  const { error } = await service
    .from('business_units')
    .update({ active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
