import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, Building2, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompanyForm } from '@/components/settings/CompanyForm'
import type { Company } from '@/types'

export default async function CompaniesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan, name')
    .eq('id', workspaceId)
    .single()

  if (!workspace || workspace.plan !== 'max') redirect('/settings/billing')

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  const canManage = member?.role === 'admin' || member?.sales_role === 'master'

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  const allCompanies = (companies ?? []) as Company[]
  const active = allCompanies.filter((c) => c.active)
  const inactive = allCompanies.filter((c) => !c.active)

  return (
    <div className="max-w-2xl w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-muted"
          aria-label="Voltar para Configurações"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} empresa{active.length !== 1 ? 's' : ''} ativa{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <CompanyForm
            trigger={
              <Button size="sm" className="flex-shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Nova empresa
              </Button>
            }
          />
        )}
      </div>

      {/* Empresas ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresas ativas</CardTitle>
          <CardDescription>
            Cada empresa possui seus próprios leads, negócios e equipe de vendas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada.</p>
              {canManage && (
                <CompanyForm
                  trigger={
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Criar primeira empresa
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {active.map((company) => (
                <CompanyRow key={company.id} company={company} canManage={canManage} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empresas inativas */}
      {inactive.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Empresas inativas</CardTitle>
            <CardDescription>
              Dados preservados. Reative para usar novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {inactive.map((company) => (
                <CompanyRow key={company.id} company={company} canManage={canManage} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CompanyRow({ company, canManage }: { company: Company; canManage: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
          {company.cnpj && (
            <p className="text-xs text-muted-foreground">CNPJ: {company.cnpj}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!company.active && <Badge variant="secondary">Inativa</Badge>}
        {canManage && (
          <>
            <CompanyForm
              company={company}
              trigger={
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              }
            />
            <ToggleActiveButton companyId={company.id} active={company.active} />
          </>
        )}
      </div>
    </div>
  )
}

function ToggleActiveButton({ companyId, active }: { companyId: string; active: boolean }) {
  return (
    <form
      action={async () => {
        'use server'
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        await supabase.from('companies').update({ active: !active }).eq('id', companyId)
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-muted-foreground hover:text-foreground"
        title={active ? 'Desativar empresa' : 'Reativar empresa'}
      >
        {active ? (
          <ToggleRight className="w-4 h-4 text-green-600" />
        ) : (
          <ToggleLeft className="w-4 h-4" />
        )}
      </Button>
    </form>
  )
}
