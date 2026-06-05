'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Send, Copy, CheckCircle2, Upload, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Proposal } from '@/types'

interface PropostaActionsProps {
  proposal: Proposal
  publicLink: string
}

export function PropostaActions({ proposal, publicLink }: PropostaActionsProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  function copyLink() {
    navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function markAsSent() {
    await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    })
    router.refresh()
  }

  async function handleVendorUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setUploadError('Selecione um arquivo PDF.')
      return
    }

    setUploading(true)
    setUploadError('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/proposals/${proposal.id}/upload-signed`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setUploading(false)

    if (!res.ok) {
      setUploadError(data.error || 'Erro no upload.')
      return
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        {/* Linha principal de ações */}
        <div className="flex flex-wrap gap-2">
          {/* Baixar PDF original */}
          <a href={`/api/proposals/${proposal.id}/pdf`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" />
              Baixar PDF
            </Button>
          </a>

          {/* Copiar link do cliente */}
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied
              ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" />
              : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? 'Link copiado!' : 'Link do cliente'}
          </Button>

          {/* Marcar como enviada */}
          {proposal.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={markAsSent} className="text-blue-600 border-blue-300">
              <Send className="w-4 h-4 mr-1.5" />
              Marcar como enviada
            </Button>
          )}

          {/* Link externo para visualização */}
          <a href={publicLink} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Visualizar como cliente →
            </Button>
          </a>
        </div>

        {/* Área de assinatura do vendedor */}
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Assinatura do Vendedor (Gov.br / ICP-Brasil)</p>
              {proposal.signed_by_seller_at ? (
                <p className="text-xs text-green-600 mt-0.5">
                  ✓ PDF assinado anexado em {new Date(proposal.signed_by_seller_at).toLocaleDateString('pt-BR')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Baixe o PDF, assine com seu certificado Gov.br e anexe abaixo
                </p>
              )}
            </div>
            {proposal.signed_by_seller_at && (
              <a href={`/api/proposals/${proposal.id}/download-signed`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="text-green-600 border-green-300">
                  <FileCheck className="w-4 h-4 mr-1.5" />
                  Baixar PDF assinado
                </Button>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleVendorUpload}
              className="hidden"
              id="vendor-pdf-upload"
            />
            <label
              htmlFor="vendor-pdf-upload"
              className={`inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer select-none ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground'}`}
            >
              <Upload className="w-4 h-4" />
              {uploading
                ? 'Enviando...'
                : proposal.signed_by_seller_at
                  ? 'Substituir PDF assinado'
                  : 'Anexar PDF assinado (Vendedor)'}
            </label>
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </div>
        </div>

        {proposal.status !== 'signed' && (
          <p className="text-xs text-muted-foreground">
            Link do cliente:{' '}
            <span className="font-mono text-foreground break-all">{publicLink}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
