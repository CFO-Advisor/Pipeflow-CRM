'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function getSystemPref(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(theme: Theme): 'dark' | 'light' {
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  return getSystemPref()
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolve(theme) === 'dark')
}

function saveCookie(value: string) {
  document.cookie = `theme=${value};path=/;max-age=31536000;samesite=lax`
}

export function ThemeProvider({
  children,
  initialTheme = 'system',
}: {
  children: ReactNode
  initialTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  // Guarda a referência mais recente do tema sem re-criar efeitos
  const themeRef = useRef(theme)
  themeRef.current = theme

  // ── Garantia pós-hidratação ─────────────────────────────────────────
  // O themeScript inline aplica .dark antes do React carregar, mas o ciclo
  // de hidratação do React pode resetar o classList do <html>. Este efeito
  // re-aplica o tema correto assim que o componente monta no cliente.
  useEffect(() => {
    applyTheme(themeRef.current)
  }, [])

  // ── Tema 'system': atualiza em tempo real quando o SO muda ──────────
  useEffect(() => {
    if (theme !== 'system') return
    applyTheme('system')
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // resolvedTheme é 'light' no servidor (SSR seguro) e atualiza no cliente
  // via o efeito acima. Componentes que precisam do valor exato devem usar
  // um padrão mounted para evitar mismatch de hidratação.
  const resolvedTheme = resolve(theme)

  function setTheme(next: Theme) {
    setThemeState(next)
    saveCookie(next)
    applyTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
