import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const next = searchParams.get('next') ?? '/dashboard'

  const response = NextResponse.redirect(new URL(next, request.url))

  if (id) {
    response.cookies.set('current_workspace_id', id, { path: '/', sameSite: 'lax' })
  }

  return response
}
