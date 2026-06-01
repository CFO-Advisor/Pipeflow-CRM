import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { name, cnpj, active } = await req.json()

  const { data: company, error } = await supabase
    .from('companies')
    .update({
      ...(name !== undefined && { name: name.trim() }),
      ...(cnpj !== undefined && { cnpj: cnpj?.trim() || null }),
      ...(active !== undefined && { active }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

  return NextResponse.json(company)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // Desativar em vez de deletar para preservar histórico
  const { error } = await supabase
    .from('companies')
    .update({ active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
