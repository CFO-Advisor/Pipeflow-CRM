import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email, workspaceId } = await req.json()

  if (!email || !workspaceId) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

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

  // Limite de 2 colaboradores apenas no plano Free
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

  const { error: insertError } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    invited_email: email,
    role: 'member',
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const safeName = escapeHtml(workspace?.name ?? 'um workspace')

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 8000)
  )

  try {
    await Promise.race([
      resend.emails.send({
        from: 'PipeFlow <noreply@pipeflow.app>',
        to: email,
        subject: `Você foi convidado para ${safeName} no PipeFlow`,
        html: `
          <h2>Você foi convidado!</h2>
          <p>Você recebeu um convite para colaborar no workspace <strong>${safeName}</strong> no PipeFlow CRM.</p>
          <p>Clique no botão abaixo para criar sua conta e entrar automaticamente no workspace:</p>
          <p>
            <a href="${appUrl}/register" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
              Aceitar convite e criar conta
            </a>
          </p>
          <p>Caso já tenha uma conta, <a href="${appUrl}/login">faça login</a> — o convite será aceito automaticamente.</p>
          <p style="color:#94a3b8;font-size:12px">Se você não esperava este convite, pode ignorar este e-mail.</p>
        `,
      }),
      timeout,
    ])
  } catch (err) {
    console.error('[invite] Resend error', err)
    return NextResponse.json({ success: true, warning: 'Convite salvo, mas e-mail não enviado.' })
  }

  return NextResponse.json({ success: true })
}
