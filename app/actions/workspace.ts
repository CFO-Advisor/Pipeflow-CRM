'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function createWorkspaceAction(workspaceName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado' }

  const slug = workspaceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const service = createServiceClient()

  const { data: workspace, error: wsError } = await service
    .from('workspaces')
    .insert({ name: workspaceName, slug: `${slug}-${Date.now()}` })
    .select()
    .single()

  if (wsError || !workspace) {
    return { error: wsError?.message ?? 'Falha ao inserir workspace' }
  }

  const { error: memberError } = await service
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'admin' })

  if (memberError) {
    await service.from('workspaces').delete().eq('id', workspace.id)
    return { error: memberError.message }
  }

  return { success: true }
}
