'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function deleteActivity(activityId: string, leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) throw new Error('Workspace não encontrado')

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error('Falha ao excluir atividade')

  revalidatePath(`/leads/${leadId}`)
}
