'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileCheck } from 'lucide-react'

interface VendedorSignatureBoxProps {
  proposalId: string
  signedAt: string | null
  hasPdf: boolean
}

export function VendedorSignatureBox({ proposalId, signedAt, hasPdf }: VendedorSignatureBoxProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Selecione um arquivo PDF.'); return }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/proposals/${proposalId}/upload-signed`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setUploading(false)

    if (!res.ok) { setError(data.error || 'Erro no upload.'); return }
    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <p className="text-sm font-semibold">Vendedor</p>

      {signedAt ? (
        <p className="text-xs text-green-600">✓ Assinado em {new Date(signedAt).toLocaleDateString('pt-BR')}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Aguardando assinatura</p>
      )}

      {/* Baixar PDF assinado se disponível */}
      {hasPdf && (
        <a
          href={`/api/proposals/${proposalId}/download-signed`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 hover:underline"
        >
          <FileCheck className="w-3.5 h-3.5" />
          Baixar PDF assinado
        </a>
      )}

      {/* Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        className="hidden"
        id={`vendor-upload-${proposalId}`}
        disabled={uploading}
      />
      <label
        htmlFor={`vendor-upload-${proposalId}`}
        className={`inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium transition-colors select-none ${
          uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <Upload className="w-3.5 h-3.5" />
        {uploading ? 'Enviando...' : signedAt ? 'Substituir PDF' : 'Anexar PDF assinado'}
      </label>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
