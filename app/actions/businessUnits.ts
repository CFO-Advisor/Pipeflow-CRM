'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function getWorkspaceAndMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) throw new Error('Workspace não encontrado.')

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'admin' && member.sales_role !== 'master')) {
    throw new Error('Apenas admin ou master pode gerenciar unidades de negócio.')
  }

  return { supabase, workspaceId }
}

export async function createBusinessUnit(companyId: string, name: string) {
  const { supabase, workspaceId } = await getWorkspaceAndMember()

  const { error } = await supabase
    .from('business_units')
    .insert({ workspace_id: workspaceId, company_id: companyId, name: name.trim() })

  if (error) throw new Error(error.message)
  revalidatePath('/settings/companies')
}

export async function updateBusinessUnit(buId: string, name: string) {
  const { supabase } = await getWorkspaceAndMember()

  const { error } = await supabase
    .from('business_units')
    .update({ name: name.trim() })
    .eq('id', buId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings/companies')
}

export async function toggleBusinessUnitActive(buId: string, active: boolean) {
  const { supabase } = await getWorkspaceAndMember()

  const { error } = await supabase
    .from('business_units')
    .update({ active })
    .eq('id', buId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings/companies')
}
