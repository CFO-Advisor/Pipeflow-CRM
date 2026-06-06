import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const { name, email, password, workspaceId, companyIds } = await req.json()

  if (!name || !email || !password || !workspaceId) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (member?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem cadastrar colaboradores.' }, { status: 403 })
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  if (workspace?.plan === 'free') {
    const { count } = await supabase
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if ((count ?? 0) >= 2) {
      return NextResponse.json(
        { error: 'Limite de 2 colaboradores do plano Free atingido.' },
        { status: 403 }
      )
    }
  }

  const service = createServiceClient()

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: name, must_change_password: true },
    email_confirm: true,
  })

  if (createError) {
    const msg = createError.message.toLowerCase().includes('already registered')
      ? 'Este e-mail já possui uma conta no sistema.'
      : createError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { data: newMember, error: insertError } = await service
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: created.user.id, role: 'member' })
    .select('id')
    .single()

  if (insertError || !newMember) {
    await service.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: insertError?.message ?? 'Erro ao inserir membro.' }, { status: 500 })
  }

  if (workspace?.plan === 'max' && Array.isArray(companyIds) && companyIds.length > 0) {
    await service.from('user_company_access').insert(
      companyIds.map((company_id: string) => ({ member_id: newMember.id, company_id }))
    )
  }

  return NextResponse.json({ success: true })
}
