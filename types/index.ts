export type Plan = 'free' | 'pro' | 'max'
export type UserRole = 'admin' | 'member'
export type SalesRole = 'master' | 'director' | 'manager' | 'seller'
export type DataScope = 'all' | 'team' | 'own'
export type PermissionResource = 'leads' | 'deals' | 'activities' | 'reports'
export type DealStage =
  | 'new_lead'
  | 'contacted'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'proposal'
export type AttachmentCategory = 'proposta' | 'cotacao' | 'apresentacao'

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface Company {
  id: string
  workspace_id: string
  name: string
  cnpj: string | null
  active: boolean
  created_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string | null
  role: UserRole
  sales_role: SalesRole
  manager_id: string | null
  invited_email: string | null
  joined_at: string
}

export interface UserPermission {
  id: string
  member_id: string
  resource: PermissionResource
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  data_scope: DataScope
}

export interface UserCompanyAccess {
  id: string
  member_id: string
  company_id: string
}

export interface Lead {
  id: string
  workspace_id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  status: string
  assigned_to: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  workspace_id: string
  company_id: string | null
  lead_id: string
  title: string
  value: number
  stage: DealStage
  assigned_to: string | null
  deadline: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  workspace_id: string
  company_id: string | null
  lead_id: string
  author_id: string | null
  type: ActivityType
  description: string
  scheduled_at: string | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: {
    id: string
    email: string
    user_metadata: { full_name?: string }
  } | null
  permissions?: UserPermission[]
  company_access?: UserCompanyAccess[]
}

export interface DealWithLead extends Deal {
  lead: Pick<Lead, 'id' | 'name' | 'company'> | null
  company: Pick<Company, 'id' | 'name'> | null
}

export interface DealAttachment {
  id: string
  deal_id: string
  workspace_id: string
  category: AttachmentCategory
  name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  created_at: string
  created_by: string | null
}

export interface ActivityWithAuthor extends Activity {
  author: {
    id: string
    email: string
    user_metadata: { full_name?: string }
  } | null
}

// Permissões padrão por papel (usadas quando não há registro explícito)
export const DEFAULT_PERMISSIONS: Record<SalesRole, Omit<UserPermission, 'id' | 'member_id' | 'resource'>> = {
  master:   { can_view: true,  can_create: true,  can_edit: true,  can_delete: true,  data_scope: 'all'  },
  director: { can_view: true,  can_create: true,  can_edit: true,  can_delete: false, data_scope: 'all'  },
  manager:  { can_view: true,  can_create: true,  can_edit: true,  can_delete: false, data_scope: 'team' },
  seller:   { can_view: true,  can_create: true,  can_edit: true,  can_delete: false, data_scope: 'own'  },
}

export const SALES_ROLE_LABELS: Record<SalesRole, string> = {
  master:   'Master',
  director: 'Diretor',
  manager:  'Gerente',
  seller:   'Vendedor',
}

export const PERMISSION_RESOURCE_LABELS: Record<PermissionResource, string> = {
  leads:      'Leads',
  deals:      'Negócios',
  activities: 'Atividades',
  reports:    'Relatórios',
}
