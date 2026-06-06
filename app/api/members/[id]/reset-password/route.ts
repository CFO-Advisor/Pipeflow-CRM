import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { newPassword } = await req.json()

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const service = createServiceClient()

  const { data: targetMember } = await service
    .from('workspace_members')
    .select('user_id, workspace_id')
    .eq('id', id)
    .single()

  if (!targetMember?.user_id) {
    return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })
  }

  const { data: callerMember } = await supabase
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', targetMember.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (callerMember?.role !== 'admin' && callerMember?.sales_role !== 'master') {
    return NextResponse.json({ error: 'Apenas admin ou master podem resetar senhas.' }, { status: 403 })
  }

  const { error } = await service.auth.admin.updateUserById(targetMember.user_id, {
    password: newPassword,
    user_metadata: { must_change_password: true },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
