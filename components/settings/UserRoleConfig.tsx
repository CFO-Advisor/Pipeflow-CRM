'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type {
  WorkspaceMember,
  Company,
  UserPermission,
  SalesRole,
  PermissionResource,
  DataScope,
} from '@/types'
import { SALES_ROLE_LABELS, PERMISSION_RESOURCE_LABELS, DEFAULT_PERMISSIONS } from '@/types'

interface UserRoleConfigProps {
  member: WorkspaceMember & {
    email: string
    name?: string
    permissions?: UserPermission[]
    company_access?: Array<{ company_id: string }>
  }
  companies: Company[]
  allMembers: Array<WorkspaceMember & { email: string; name?: string }>
  currentUserId: string
}

const RESOURCES: PermissionResource[] = ['leads', 'deals', 'activities', 'reports']
const SCOPE_OPTIONS: { value: DataScope; label: string }[] = [
  { value: 'own', label: 'Próprios' },
  { value: 'team', label: 'Equipe' },
  { value: 'all', label: 'Todos' },
]

export function UserRoleConfig({ member, companies, allMembers, currentUserId }: UserRoleConfigProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [salesRole, setSalesRole] = useState<SalesRole>(member.sales_role)
  const [managerId, setManagerId] = useState<string>(member.manager_id ?? 'none')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    new Set(member.company_access?.map((a) => a.company_id) ?? [])
  )
  const [permissions, setPermissions] = useState<Record<PermissionResource, Omit<UserPermission, 'id' | 'member_id' | 'resource'>>>(
    Object.fromEntries(
      RESOURCES.map((r) => {
        const existing = member.permissions?.find((p) => p.resource === r)
        const defaults = DEFAULT_PERMISSIONS[member.sales_role]
        return [r, existing ?? defaults]
      })
    ) as Record<PermissionResource, Omit<UserPermission, 'id' | 'member_id' | 'resource'>>
  )

  const eligibleManagers = allMembers.filter(
    (m) =>
      m.id !== member.id &&
      m.user_id !== currentUserId &&
      (['master', 'director', 'manager'] as SalesRole[]).includes(m.sales_role)
  )

  function toggleCompany(companyId: string) {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev)
      if (next.has(companyId)) next.delete(companyId)
      else next.add(companyId)
      return next
    })
  }

  function updatePerm<K extends keyof Omit<UserPermission, 'id' | 'member_id' | 'resource'>>(
    resource: PermissionResource,
    field: K,
    value: Omit<UserPermission, 'id' | 'member_id' | 'resource'>[K]
  ) {
    setPermissions((prev) => ({
      ...prev,
      [resource]: { ...prev[resource], [field]: value },
    }))
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_role: salesRole,
          manager_id: managerId === 'none' ? null : managerId,
          company_ids: Array.from(selectedCompanyIds),
          permissions: RESOURCES.map((r) => ({ resource: r, ...permissions[r] })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar configurações.')
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Settings2 className="w-3.5 h-3.5" />
        Configurar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurar acesso — {member.name ?? member.email}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </p>
            )}

            {/* Papel de vendas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Papel na hierarquia</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Papel de vendas</Label>
                  <Select
                    value={salesRole}
                    onValueChange={(v) => { if (v) setSalesRole(v as SalesRole) }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(SALES_ROLE_LABELS) as [SalesRole, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Superior direto</Label>
                  <Select
                    value={managerId}
                    onValueChange={(v) => setManagerId(v ?? 'none')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sem superior" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem superior</SelectItem>
                      {eligibleManagers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name ?? m.email} ({SALES_ROLE_LABELS[m.sales_role]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <RoleDescription role={salesRole} />
            </div>

            {/* Acesso por empresa (apenas para director) */}
            {salesRole === 'director' && companies.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Acesso por empresa</h3>
                  <p className="text-xs text-muted-foreground">
                    Diretores acessam apenas dados das empresas selecionadas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {companies.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCompanyIds.has(c.id)}
                          onChange={() => toggleCompany(c.id)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Permissões por recurso */}
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Permissões por recurso</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Recurso</th>
                      <th className="text-center px-2 font-medium text-muted-foreground">Ver</th>
                      <th className="text-center px-2 font-medium text-muted-foreground">Criar</th>
                      <th className="text-center px-2 font-medium text-muted-foreground">Editar</th>
                      <th className="text-center px-2 font-medium text-muted-foreground">Excluir</th>
                      <th className="text-center pl-3 font-medium text-muted-foreground">Visibilidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCES.map((r) => (
                      <tr key={r} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{PERMISSION_RESOURCE_LABELS[r]}</td>
                        {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((field) => (
                          <td key={field} className="text-center px-2">
                            <input
                              type="checkbox"
                              checked={permissions[r][field]}
                              onChange={(e) => updatePerm(r, field, e.target.checked)}
                              className="accent-blue-600"
                            />
                          </td>
                        ))}
                        <td className="pl-3 py-1.5">
                          <Select
                            value={permissions[r].data_scope}
                            onValueChange={(v) => { if (v) updatePerm(r, 'data_scope', v as DataScope) }}
                          >
                            <SelectTrigger size="sm" className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SCOPE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RoleDescription({ role }: { role: SalesRole }) {
  const descriptions: Record<SalesRole, string> = {
    master: 'Acesso total: vê todos os dados de todas as empresas e equipes.',
    director: 'Acesso às empresas atribuídas e todos os dados dessas empresas.',
    manager: 'Acesso aos próprios registros e aos registros da equipe direta.',
    seller: 'Acesso apenas aos próprios leads e negócios (atribuídos a você).',
  }
  return (
    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
      {descriptions[role]}
    </p>
  )
}
