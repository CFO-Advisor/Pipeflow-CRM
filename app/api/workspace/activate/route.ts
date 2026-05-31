import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const next = searchParams.get('next') ?? '/dashboard'

  // Validate next is a safe relative path (prevent open redirect)
  const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  const redirectUrl = new URL(safePath, request.url)

  if (!id) {
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Verify user is a member of this workspace before setting cookie
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set('current_workspace_id', id, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
