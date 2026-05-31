export type Plan = 'free' | 'pro'
export type UserRole = 'admin' | 'member'
export type DealStage =
  | 'new_lead'
  | 'contacted'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note'

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string | null
  role: UserRole
  invited_email: string | null
  joined_at: string
}

export interface Lead {
  id: string
  workspace_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  status: string
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  workspace_id: string
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
  lead_id: string
  author_id: string | null
  type: ActivityType
  description: string
  created_at: string
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: {
    id: string
    email: string
    user_metadata: { full_name?: string }
  } | null
}

export interface DealWithLead extends Deal {
  lead: Pick<Lead, 'id' | 'name' | 'company'> | null
}

export interface ActivityWithAuthor extends Activity {
  author: {
    id: string
    email: string
    user_metadata: { full_name?: string }
  } | null
}
