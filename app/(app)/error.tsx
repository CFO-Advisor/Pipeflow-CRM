'use client'

import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-foreground px-4">
      <h2 className="text-xl font-bold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground max-w-sm text-center">
        Não foi possível carregar esta página. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Tentar novamente
      </button>
    </div>
  )
}
