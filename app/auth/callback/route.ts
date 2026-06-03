import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Prevent open redirect: only allow safe relative paths
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se o usuário foi convidado para algum workspace
      const userEmail = data.user.email
      if (userEmail) {
        const { data: pendingInvite } = await supabase
          .from('workspace_members')
          .select('id, workspace_id')
          .eq('invited_email', userEmail)
          .is('user_id', null)
          .limit(1)
          .maybeSingle()

        if (pendingInvite) {
          // Aceitar convite: associar user_id ao registro pendente
          await supabase
            .from('workspace_members')
            .update({ user_id: data.user.id, invited_email: null })
            .eq('id', pendingInvite.id)

          // Ativar o workspace do convite via cookie
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
        .eq('user_id', data.user.id)

      if (count === 0) {
        const workspaceName = data.user.user_metadata?.workspace_name ?? 'Meu Workspace'
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
            user_id: data.user.id,
            role: 'admin',
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
