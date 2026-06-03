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

  // Confirmar que o usuário é membro do workspace e verificar sales_role
  const { data: member } = await service
    .from('workspace_members')
    .select('id, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.redirect(redirectTo)

  // No plano MAX, sellers e managers sem acesso explícito não podem ativar a empresa
  const { data: workspace } = await service
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  const restrictedRoles = ['seller', 'manager']
  if (workspace?.plan === 'max' && restrictedRoles.includes(member.sales_role ?? '')) {
    const { data: access } = await service
      .from('user_company_access')
      .select('id')
      .eq('member_id', member.id)
      .eq('company_id', companyId)
      .single()

    if (!access) return NextResponse.redirect(redirectTo)
  }

  response.cookies.set('current_company_id', companyId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
