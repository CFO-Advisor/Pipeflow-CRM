'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(theme: Theme): 'dark' | 'light' {
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  if (typeof window !== 'undefined') return getSystemPref()
  return 'light'
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

  // Para tema 'system': aplica preferência do SO no client (o servidor não sabe)
  useEffect(() => {
    if (theme === 'system') applyTheme('system')
  }, [theme])

  // Atualiza em tempo real quando o SO muda de light ↔ dark
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

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
