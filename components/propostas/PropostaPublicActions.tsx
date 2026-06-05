'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, XCircle, Download, Upload, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProposalStatus } from '@/types'

interface PropostaPublicActionsProps {
  token: string
  status: ProposalStatus
  hasVendorPdf: boolean       // se o vendedor já anexou o PDF assinado
  clientSignedAt: string | null
}

export function PropostaPublicActions({
  token,
  status,
  hasVendorPdf,
  clientSignedAt,
}: PropostaPublicActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [error, setError] = useState('')

  // Proposta já completamente assinada
  if (status === 'signed' || uploadDone) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle2 className="w-5 h-5" />
        Proposta assinada. Obrigado!
      </div>
    )
  }

  if (status === 'rejected' || rejected) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <XCircle className="w-5 h-5 text-red-500" />
        Proposta recusada.
      </div>
    )
  }

  async function handleClientUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Selecione um arquivo PDF.')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/proposals/public/${token}/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setUploading(false)

    if (!res.ok) {
      setError(data.error || 'Erro no upload.')
      return
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadDone(true)
  }

  async function handleReject() {
    setRejectLoading(true)
    setError('')
    const res = await fetch(`/api/proposals/public/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    setRejectLoading(false)
    if (res.ok) setRejected(true)
    else setError('Erro ao processar.')
  }

  return (
    <div className="space-y-4">
      {/* Passo 1: Baixar PDF assinado pelo vendedor */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Passo 1 — Baixar e assinar o documento</p>
        {hasVendorPdf ? (
          <a href={`/api/proposals/public/${token}/download`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
              <FileCheck className="w-4 h-4 mr-1.5" />
              Baixar PDF assinado pelo vendedor
            </Button>
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">
            O vendedor ainda não assinou o documento. Aguarde o PDF assinado ser disponibilizado.
          </p>
        )}
      </div>

      {/* Passo 2: Upload do PDF assinado pelo cliente */}
      {hasVendorPdf && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Passo 2 — Assine com Gov.br e anexe aqui</p>
          <p className="text-xs text-muted-foreground">
            Baixe o PDF acima, assine com seu certificado digital Gov.br (ICP-Brasil) e faça o upload abaixo.
          </p>

          {clientSignedAt ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              PDF assinado recebido em {new Date(clientSignedAt).toLocaleDateString('pt-BR')}
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleClientUpload}
                className="hidden"
                id="client-pdf-upload"
              />
              <label
                htmlFor="client-pdf-upload"
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors select-none ${uploading ? 'bg-green-600/60 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'}`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Enviando...' : 'Anexar minha assinatura (PDF)'}
              </label>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {/* Recusar */}
      {!clientSignedAt && (
        <div className="pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            disabled={rejectLoading}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            {rejectLoading ? 'Processando...' : 'Recusar proposta'}
          </Button>
        </div>
      )}
    </div>
  )
}
