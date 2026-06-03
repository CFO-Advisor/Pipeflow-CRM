import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function resolveCallerRole(companyId: string, userId: string) {
  const service = createServiceClient()

  // Buscar workspace da empresa
  const { data: company } = await service
    .from('companies')
    .select('workspace_id')
    .eq('id', companyId)
    .single()

  if (!company) return { company: null, allowed: false }

  // Verificar se o usuário é membro com role admin ou sales_role master
  const { data: member } = await service
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', company.workspace_id)
    .eq('user_id', userId)
    .single()

  if (!member) return { company, allowed: false }

  const allowed = member.role === 'admin' || member.sales_role === 'master'
  return { company, allowed }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { company, allowed } = await resolveCallerRole(id, user.id)
  if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Apenas admin ou master pode editar empresas.' }, { status: 403 })

  const { name, cnpj, active } = await req.json()

  const service = createServiceClient()
  const { data: updated, error } = await service
    .from('companies')
    .update({
      ...(name !== undefined && { name: name.trim() }),
      ...(cnpj !== undefined && { cnpj: cnpj?.trim() || null }),
      ...(active !== undefined && { active }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { company, allowed } = await resolveCallerRole(id, user.id)
  if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Apenas admin ou master pode excluir empresas.' }, { status: 403 })

  // Desativar em vez de deletar para preservar histórico
  const service = createServiceClient()
  const { error } = await service
    .from('companies')
    .update({ active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
