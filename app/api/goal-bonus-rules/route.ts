import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('goal_bonus_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('trigger_pct')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const service = createServiceClient()
  const { data: member } = await service
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'admin' && member.sales_role !== 'master')) {
    return NextResponse.json({ error: 'Apenas admin ou master pode criar regras.' }, { status: 403 })
  }

  const { name, trigger_pct, bonus_type, bonus_value, applies_to = 'all' } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  if (!trigger_pct || trigger_pct <= 0 || trigger_pct > 300) {
    return NextResponse.json({ error: 'Percentual de disparo deve ser entre 1 e 300.' }, { status: 400 })
  }
  if (!['fixed', 'salary_pct', 'revenue_pct'].includes(bonus_type)) {
    return NextResponse.json({ error: 'Tipo de bônus inválido.' }, { status: 400 })
  }
  if (!bonus_value || bonus_value <= 0) {
    return NextResponse.json({ error: 'Valor do bônus deve ser maior que zero.' }, { status: 400 })
  }

  const { data, error } = await service
    .from('goal_bonus_rules')
    .insert({ workspace_id: workspaceId, name: name.trim(), trigger_pct, bonus_type, bonus_value, applies_to })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
