'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AuthError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground px-4">
      <h2 className="text-xl font-bold">Erro de autenticação</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Ocorreu um problema. Tente fazer login novamente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Tentar novamente
        </button>
        <Link
          href="/login"
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Ir para login
        </Link>
      </div>
    </div>
  )
}
