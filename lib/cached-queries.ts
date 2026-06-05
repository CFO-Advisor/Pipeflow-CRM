import 'server-only'
import { unstable_cache } from 'next/cache'
import { createServiceClient } from './supabase/service'
import type { Company, BusinessUnit } from '@/types'

// Usuários do auth — TTL 5 min, evita 3x auth.admin.listUsers por sessão
export const getCachedAuthUsers = unstable_cache(
  async () => {
    const service = createServiceClient()
    const { data } = await service.auth.admin.listUsers({ perPage: 1000 })
    return data?.users ?? []
  },
  ['supabase-auth-users'],
  { revalidate: 300 }
)

// Empresas por workspace — TTL 30 s, invalida com revalidateTag(`companies-${workspaceId}`)
export function getCachedCompanies(workspaceId: string) {
  return unstable_cache(
    async () => {
      const service = createServiceClient()
      const { data } = await service
        .from('companies')
        .select('id, name, cnpj, logo_url, active, workspace_id, created_at')
        .eq('workspace_id', workspaceId)
        .order('name')
      return (data ?? []) as Company[]
    },
    [`companies-${workspaceId}`],
    { revalidate: 30, tags: [`companies-${workspaceId}`] }
  )()
}

// Unidades de negócio por workspace — TTL 30 s
export function getCachedBusinessUnits(workspaceId: string) {
  return unstable_cache(
    async () => {
      const service = createServiceClient()
      const { data } = await service
        .from('business_units')
        .select('id, name, company_id, workspace_id, active, created_at')
        .eq('workspace_id', workspaceId)
        .eq('active', true)
        .order('name')
      return (data ?? []) as BusinessUnit[]
    },
    [`business-units-${workspaceId}`],
    { revalidate: 30, tags: [`business-units-${workspaceId}`] }
  )()
}
