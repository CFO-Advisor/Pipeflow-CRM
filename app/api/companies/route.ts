import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  if (workspace?.plan !== 'max') {
    return NextResponse.json({ error: 'Recurso disponível apenas no plano MAX.' }, { status: 403 })
  }

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(companies)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 400 })

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'admin' && member.sales_role !== 'master')) {
    return NextResponse.json({ error: 'Apenas admin ou master pode criar empresas.' }, { status: 403 })
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single()

  if (workspace?.plan !== 'max') {
    return NextResponse.json({ error: 'Recurso disponível apenas no plano MAX.' }, { status: 403 })
  }

  const { name, cnpj } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome da empresa é obrigatório.' }, { status: 400 })
  }

  const { data: company, error } = await supabase
    .from('companies')
    .insert({ workspace_id: workspaceId, name: name.trim(), cnpj: cnpj?.trim() || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(company, { status: 201 })
}
