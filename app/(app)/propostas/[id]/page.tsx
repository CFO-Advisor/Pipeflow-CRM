import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, FileCheck } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PropostaStatusBadge } from '@/components/propostas/PropostaStatusBadge'
import { PropostaActions } from '@/components/propostas/PropostaActions'
import { VendedorSignatureBox } from '@/components/propostas/VendedorSignatureBox'
import { formatCurrency } from '@/lib/utils'
import type { Proposal } from '@/types'

export default async function PropostaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('current_workspace_id')?.value
  if (!workspaceId) redirect('/dashboard')

  const service = createServiceClient()
  const { data: proposal } = await service
    .from('proposals')
    .select('*, items:proposal_items(*), lead:leads(name, company), deal:deals(lead:leads(name, company))')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!proposal) notFound()

  const p = proposal as Proposal & { items: NonNullable<Proposal['items']> }

  // Buscar empresa e nome do lead (direto ou via deal)
  const directLead = Array.isArray(proposal.lead) ? proposal.lead[0] : proposal.lead
  const dealObj = Array.isArray(proposal.deal) ? proposal.deal[0] : proposal.deal
  const dealLead = Array.isArray(dealObj?.lead) ? dealObj.lead[0] : dealObj?.lead
  const lead = directLead ?? dealLead
  const leadCompany: string | null = lead?.company ?? null
  const leadName: string | null = lead?.name ?? null
  const items = p.items ?? []
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  const publicLink = `${appUrl}/proposta/${p.public_token}`

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/propostas" className="text-muted-foreground hover:text-foreground p-1 -ml-1 rounded-md hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{p.title}</h1>
            <PropostaStatusBadge status={p.status} />
            {(leadCompany || leadName) && (
              <span className="text-sm text-muted-foreground">
                {[leadCompany, leadName].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Criada em {new Date(p.created_at).toLocaleDateString('pt-BR')}
            {p.valid_until && ` · Válida até ${new Date(p.valid_until).toLocaleDateString('pt-BR')}`}
          </p>
        </div>
      </div>

      {/* Ações */}
      <PropostaActions proposal={p} publicLink={publicLink} />

      {/* Itens */}
      {items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Itens</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                    <th className="text-left pb-2 font-medium">Descrição</th>
                    <th className="text-right pb-2 font-medium w-16">Qtd</th>
                    <th className="text-right pb-2 font-medium w-28">Unit.</th>
                    <th className="text-right pb-2 font-medium w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.sort((a, b) => a.position - b.position).map(item => (
                    <tr key={item.id}>
                      <td className="py-2.5">{item.description}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={3} className="pt-3 pb-1 text-right font-semibold text-foreground pr-4">Total</td>
                    <td className="pt-3 pb-1 text-right font-bold text-lg text-foreground">{formatCurrency(p.total_value)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descrição e observações */}
      {(p.description || p.notes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {p.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</p></CardContent>
            </Card>
          )}
          {p.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.notes}</p></CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Assinaturas */}
      <Card>
        <CardHeader><CardTitle className="text-base">Assinaturas Gov.br (ICP-Brasil)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Baixe o PDF, assine com seu certificado digital Gov.br e faça o upload do arquivo assinado.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VendedorSignatureBox
              proposalId={p.id}
              signedAt={p.signed_by_seller_at}
              hasPdf={!!p.signed_pdf_path}
              clientHadSigned={!!p.signed_by_client_at}
            />
            <div className="border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold">Cliente</p>
              {p.signed_by_client_at ? (
                <>
                  <p className="text-xs text-green-600">✓ Assinado em {new Date(p.signed_by_client_at).toLocaleDateString('pt-BR')}</p>
                  <a
                    href={`/api/proposals/${p.id}/download-client-signed`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 hover:underline"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Baixar PDF assinado
                  </a>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Aguardando assinatura do cliente</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
