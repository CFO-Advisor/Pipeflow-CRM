import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const { name, company_id } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Nome da unidade é obrigatório.' }, { status: 400 })
  if (!company_id)    return NextResponse.json({ error: 'Empresa é obrigatória.' }, { status: 400 })

  const service = createServiceClient()

  // Verificar que a empresa pertence ao workspace
  const { data: company } = await service
    .from('companies')
    .select('id')
    .eq('id', company_id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

  const { data: bu, error } = await service
    .from('business_units')
    .insert({ workspace_id: workspaceId, company_id, name: name.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(bu, { status: 201 })
}
