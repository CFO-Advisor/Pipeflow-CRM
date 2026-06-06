'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })

    setForgotLoading(false)
    if (error) {
      setForgotError('Não foi possível enviar o e-mail. Tente novamente.')
    } else {
      setForgotSent(true)
    }
  }

  function switchToForgot() {
    setForgotEmail(email)
    setForgotSent(false)
    setForgotError('')
    setMode('forgot')
  }

  function switchToLogin() {
    setMode('login')
    setForgotSent(false)
    setForgotError('')
  }

  const logo = (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white text-sm font-bold">S</span>
      </div>
      <span className="text-xl font-bold text-foreground">Sales Flow</span>
    </div>
  )

  if (mode === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            {logo}
            <CardTitle className="text-2xl">Recuperar senha</CardTitle>
            <CardDescription>
              {forgotSent
                ? 'Verifique sua caixa de entrada'
                : 'Digite seu e-mail para receber um link de redefinição de senha'}
            </CardDescription>
          </CardHeader>

          {forgotSent ? (
            <>
              <CardContent>
                <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3">
                  Enviamos um link de redefinição de senha para <strong>{forgotEmail}</strong>.
                  Verifique também a pasta de spam.
                </div>
              </CardContent>
              <CardFooter>
                <Button type="button" variant="ghost" className="w-full" onClick={switchToLogin}>
                  Voltar ao login
                </Button>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <CardContent className="space-y-4">
                {forgotError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    {forgotError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">E-mail</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={switchToLogin}>
                  Voltar ao login
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {logo}
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {message && (
              <div className="text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                {message}
              </div>
            )}
            {(error || authError) && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {authError === 'link_expired'
                  ? 'O link de convite expirou. Peça ao administrador para reenviar o convite.'
                  : authError === 'auth_callback_failed'
                  ? 'Link de confirmação inválido ou expirado. Tente criar a conta novamente.'
                  : error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-xs text-blue-600 hover:underline focus:outline-none"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Não tem conta?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Criar conta grátis
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
