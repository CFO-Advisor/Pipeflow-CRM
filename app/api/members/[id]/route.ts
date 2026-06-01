import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { SalesRole, UserPermission } from '@/types'

interface UpdateMemberBody {
  sales_role?: SalesRole
  manager_id?: string | null
  company_ids?: string[]
  permissions?: Array<Omit<UserPermission, 'id' | 'member_id'>>
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // Busca o membro-alvo para saber o workspace
  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('id', memberId)
    .single()

  if (!targetMember) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })

  // Verifica se o caller é admin ou master do workspace
  const { data: callerMember } = await supabase
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', targetMember.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!callerMember || (callerMember.role !== 'admin' && callerMember.sales_role !== 'master')) {
    return NextResponse.json({ error: 'Apenas admin ou master pode configurar membros.' }, { status: 403 })
  }

  // Verificar plano MAX
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', targetMember.workspace_id)
    .single()

  if (workspace?.plan !== 'max') {
    return NextResponse.json({ error: 'Recurso disponível apenas no plano MAX.' }, { status: 403 })
  }

  const body: UpdateMemberBody = await req.json()
  const service = createServiceClient()

  // 1. Atualizar sales_role e manager_id
  if (body.sales_role !== undefined || body.manager_id !== undefined) {
    const { error } = await service
      .from('workspace_members')
      .update({
        ...(body.sales_role !== undefined && { sales_role: body.sales_role }),
        ...(body.manager_id !== undefined && { manager_id: body.manager_id }),
      })
      .eq('id', memberId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Atualizar acesso por empresa (substitui tudo)
  if (body.company_ids !== undefined) {
    await service.from('user_company_access').delete().eq('member_id', memberId)

    if (body.company_ids.length > 0) {
      const { error } = await service.from('user_company_access').insert(
        body.company_ids.map((company_id) => ({ member_id: memberId, company_id }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // 3. Upsert permissões por recurso
  if (body.permissions && body.permissions.length > 0) {
    for (const perm of body.permissions) {
      const { error } = await service
        .from('user_permissions')
        .upsert(
          { ...perm, member_id: memberId },
          { onConflict: 'member_id,resource' }
        )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
