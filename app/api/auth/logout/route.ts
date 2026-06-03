import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete('current_workspace_id')
  response.cookies.delete('current_company_id')
  return response
}
