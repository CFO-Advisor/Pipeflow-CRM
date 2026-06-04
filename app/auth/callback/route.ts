import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Prevent open redirect: only allow safe relative paths
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  const supabase = await createClient()
  let sessionData: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>['data'] | null = null
  let sessionError: unknown = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    sessionData = data
    sessionError = error
  } else if (tokenHash && type) {
    // Fluxo de confirmação de e-mail (signup/email change) — usa token_hash + type
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    sessionData = data
    sessionError = error
  }

  if (!sessionError && sessionData?.user) {
    const user = sessionData.user
    const isEmailConfirmation = type === 'signup' || type === 'email'

    // Verificar se o usuário foi convidado para algum workspace
    const userEmail = user.email
    if (userEmail) {
      const { data: pendingInvite } = await supabase
        .from('workspace_members')
        .select('id, workspace_id')
        .eq('invited_email', userEmail)
        .is('user_id', null)
        .limit(1)
        .maybeSingle()

      if (pendingInvite) {
        await supabase
          .from('workspace_members')
          .update({ user_id: user.id, invited_email: null })
          .eq('id', pendingInvite.id)

        const response = NextResponse.redirect(`${origin}/dashboard`)
        response.cookies.set('current_workspace_id', pendingInvite.workspace_id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        return response
      }
    }

    // Cria workspace se ainda não existe para este usuário
    const { count } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count === 0) {
      const workspaceName = user.user_metadata?.workspace_name ?? 'Meu Workspace'
      const slug = workspaceName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { data: workspace } = await supabase
        .from('workspaces')
        .insert({ name: workspaceName, slug: `${slug}-${Date.now()}` })
        .select()
        .single()

      if (workspace) {
        await supabase.from('workspace_members').insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'admin',
        })
      }
    }

    // Confirmação de e-mail: mostrar mensagem de sucesso antes de pedir login
    if (isEmailConfirmation) {
      return NextResponse.redirect(
        `${origin}/login?message=E-mail+confirmado+com+sucesso!+Fa%C3%A7a+login+para+acessar+o+sistema.`
      )
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
