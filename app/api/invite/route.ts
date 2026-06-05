import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const { email, workspaceId } = await req.json()

  if (!email || !workspaceId) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
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
    return NextResponse.json({ error: 'Apenas admins podem convidar.' }, { status: 403 })
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan, name')
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

  // Verificar se já existe convite pendente ou membro ativo com este e-mail
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id, user_id')
    .eq('workspace_id', workspaceId)
    .eq('invited_email', email)
    .maybeSingle()

  if (existing?.user_id) {
    return NextResponse.json({ error: 'Este usuário já é membro do workspace.' }, { status: 400 })
  }
  if (existing) {
    return NextResponse.json({ error: 'Já existe um convite pendente para este e-mail.' }, { status: 400 })
  }

  const { error: insertError } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    invited_email: email,
    role: 'member',
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Envia convite pelo Supabase Auth — usa a infraestrutura de e-mail já configurada no projeto,
  // sem depender de domínio verificado em serviço externo.
  const service = createServiceClient()
  // Deriva a URL do app a partir do header da requisição quando NEXT_PUBLIC_APP_URL não está definido,
  // garantindo que o link de convite funcione tanto em produção quanto em desenvolvimento.
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  const protocol = req.headers.get('x-forwarded-proto') ?? 'http'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`

  const { error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback`,
    data: { workspace_name: workspace?.name },
  })

  if (inviteError) {
    console.error('[invite] Supabase invite error:', inviteError.message)
    return NextResponse.json({
      success: true,
      warning: `Convite salvo, mas o e-mail não pôde ser enviado automaticamente. Informe o colaborador para acessar ${appUrl}/register e usar o e-mail ${email}.`,
    })
  }

  return NextResponse.json({ success: true })
}
