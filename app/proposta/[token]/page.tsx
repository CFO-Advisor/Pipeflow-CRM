import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PropostaStatusBadge } from '@/components/propostas/PropostaStatusBadge'
import { PropostaPublicActions } from '@/components/propostas/PropostaPublicActions'
import { formatCurrency } from '@/lib/utils'
import type { Proposal, ProposalItem } from '@/types'

export default async function PropostaPublicPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const service = createServiceClient()

  const { data } = await service
    .from('proposals')
    .select('*, items:proposal_items(*)')
    .eq('public_token', token)
    .single()

  if (!data) notFound()

  const proposal = data as Proposal & { items: ProposalItem[] }
  const items = proposal.items ?? []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{proposal.title}</h1>
          <div className="flex items-center justify-center gap-2">
            <PropostaStatusBadge status={proposal.status} />
            {proposal.valid_until && (
              <span className="text-sm text-muted-foreground">
                Válida até {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        {/* Descrição */}
        {proposal.description && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{proposal.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Itens */}
        {items.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Itens da Proposta</CardTitle></CardHeader>
            <CardContent>
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
                  <tr className="border-t-2 border-border">
                    <td colSpan={3} className="pt-3 text-right font-semibold pr-4">Total</td>
                    <td className="pt-3 text-right font-bold text-lg text-blue-600">{formatCurrency(proposal.total_value)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        {proposal.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{proposal.notes}</p></CardContent>
          </Card>
        )}

        {/* Assinaturas e ações do cliente */}
        <Card>
          <CardHeader><CardTitle className="text-base">Assinatura</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Vendedor</p>
                {proposal.signed_by_seller_at
                  ? <p className="text-xs text-green-600">✓ Assinado em {new Date(proposal.signed_by_seller_at).toLocaleDateString('pt-BR')}</p>
                  : <p className="text-xs text-muted-foreground">Pendente</p>}
              </div>
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Cliente</p>
                {proposal.signed_by_client_at
                  ? <p className="text-xs text-green-600">✓ Aceito em {new Date(proposal.signed_by_client_at).toLocaleDateString('pt-BR')}</p>
                  : <p className="text-xs text-muted-foreground">Aguardando seu aceite</p>}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Para assinatura com validade jurídica (ICP-Brasil / Gov.br): baixe o PDF, assine com seu certificado digital e envie o arquivo assinado ao emissor da proposta.
            </p>

            <PropostaPublicActions
              token={token}
              status={proposal.status}
              hasVendorPdf={!!proposal.signed_pdf_path}
              clientSignedAt={proposal.signed_by_client_at}
            />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Proposta gerada pelo PipeFlow CRM
        </p>
      </div>
    </div>
  )
}
