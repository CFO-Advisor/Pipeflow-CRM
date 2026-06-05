import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, Building2, Layers, Plus, Pencil, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompanyForm } from '@/components/settings/CompanyForm'
import { BusinessUnitForm } from '@/components/settings/BusinessUnitForm'
import type { Company, BusinessUnit } from '@/types'

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

  if (!workspace) redirect('/dashboard')

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role, sales_role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  const canManage = member?.role === 'admin' || member?.sales_role === 'master'

  const [{ data: companies }, { data: allBUs }] = await Promise.all([
    supabase.from('companies').select('*').eq('workspace_id', workspaceId).order('name'),
    supabase.from('business_units').select('*').eq('workspace_id', workspaceId).order('name'),
  ])

  const allCompanies = (companies ?? []) as Company[]
  const businessUnits = (allBUs ?? []) as BusinessUnit[]
  const active = allCompanies.filter((c) => c.active)
  const inactive = allCompanies.filter((c) => !c.active)

  const plan = workspace.plan
  const atLimit = plan !== 'max' && active.length >= 1

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
          atLimit ? (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 flex-shrink-0 bg-amber-50 dark:bg-amber-950/30">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Plano {plan.toUpperCase()} — limite de 1 empresa. <span className="font-semibold">Assine o MAX para mais.</span></span>
            </div>
          ) : (
            <CompanyForm
              trigger={
                <Button size="sm" className="flex-shrink-0">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nova empresa
                </Button>
              }
            />
          )
        )}
      </div>

      {/* Empresas ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresas ativas</CardTitle>
          <CardDescription>
            Organize leads e negócios por empresa e suas unidades de negócio.
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
                <CompanyRow
                  key={company.id}
                  company={company}
                  canManage={canManage}
                  businessUnits={businessUnits.filter((bu) => bu.company_id === company.id)}
                />
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
                <CompanyRow
                  key={company.id}
                  company={company}
                  canManage={canManage}
                  businessUnits={businessUnits.filter((bu) => bu.company_id === company.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CompanyRow({
  company,
  canManage,
  businessUnits,
}: {
  company: Company
  canManage: boolean
  businessUnits: BusinessUnit[]
}) {
  const activeBUs = businessUnits.filter((bu) => bu.active)
  const inactiveBUs = businessUnits.filter((bu) => !bu.active)

  return (
    <div className="py-3 space-y-2">
      {/* Linha da empresa */}
      <div className="flex items-center justify-between gap-3">
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

      {/* Unidades de Negócio */}
      <div className="ml-11 space-y-1">
        {activeBUs.map((bu) => (
          <BusinessUnitRow key={bu.id} bu={bu} canManage={canManage} />
        ))}
        {inactiveBUs.map((bu) => (
          <BusinessUnitRow key={bu.id} bu={bu} canManage={canManage} />
        ))}
        {canManage && company.active && (
          <BusinessUnitForm
            companyId={company.id}
            trigger={
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                <Plus className="w-3.5 h-3.5" />
                Nova unidade de negócio
              </button>
            }
          />
        )}
        {businessUnits.length === 0 && !canManage && (
          <p className="text-xs text-muted-foreground italic">Sem unidades de negócio.</p>
        )}
      </div>
    </div>
  )
}

function BusinessUnitRow({ bu, canManage }: { bu: BusinessUnit; canManage: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1 bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2 min-w-0">
        <Layers className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-foreground truncate">{bu.name}</span>
        {!bu.active && <Badge variant="secondary" className="text-[10px] px-1 py-0">Inativa</Badge>}
      </div>
      {canManage && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <BusinessUnitForm
            companyId={bu.company_id}
            businessUnit={bu}
            trigger={
              <Button variant="ghost" size="icon" className="w-6 h-6">
                <Pencil className="w-3 h-3" />
              </Button>
            }
          />
          <ToggleActiveBUButton buId={bu.id} active={bu.active} />
        </div>
      )}
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

function ToggleActiveBUButton({ buId, active }: { buId: string; active: boolean }) {
  return (
    <form
      action={async () => {
        'use server'
        const { toggleBusinessUnitActive } = await import('@/app/actions/businessUnits')
        await toggleBusinessUnitActive(buId, !active)
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="w-6 h-6 text-muted-foreground hover:text-foreground"
        title={active ? 'Desativar unidade' : 'Reativar unidade'}
      >
        {active ? (
          <ToggleRight className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <ToggleLeft className="w-3.5 h-3.5" />
        )}
      </Button>
    </form>
  )
}
