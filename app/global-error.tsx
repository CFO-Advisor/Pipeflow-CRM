'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 px-4">
        <h2 className="text-2xl font-bold">Algo deu errado</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm text-center">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400 dark:text-neutral-600 font-mono">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
