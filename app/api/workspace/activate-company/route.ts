import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('id')
  const next = searchParams.get('next') ?? '/dashboard'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectTo = new URL(next, appUrl)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(redirectTo)

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value

  if (!workspaceId) return NextResponse.redirect(redirectTo)

  const response = NextResponse.redirect(redirectTo)

  if (!companyId || companyId === 'all') {
    response.cookies.delete('current_company_id')
    return response
  }

  // Verificar que a empresa pertence ao workspace e que o usuário é membro
  const service = createServiceClient()
  const { data: company } = await service
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('workspace_id', workspaceId)
    .eq('active', true)
    .single()

  if (!company) return NextResponse.redirect(redirectTo)

  // Confirmar que o usuário é membro do workspace
  const { data: member } = await service
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.redirect(redirectTo)

  response.cookies.set('current_company_id', companyId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
