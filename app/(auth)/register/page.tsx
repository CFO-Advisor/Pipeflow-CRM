'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createWorkspaceAction } from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingUser, setExistingUser] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setExistingUser(data.user.id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Usuário já autenticado mas sem workspace — apenas cria o workspace
    if (existingUser) {
      const result = await createWorkspaceAction(workspaceName)
      if (result.success) {
        router.refresh()
        router.push('/dashboard')
      } else {
        setError(result.error ?? 'Erro ao criar workspace.')
        setLoading(false)
      }
      return
    }

    const supabase = createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, workspace_name: workspaceName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    // Supabase retornou sessão imediata (confirmação de e-mail desativada)
    if (signUpData.session && signUpData.user) {
      const result = await createWorkspaceAction(workspaceName)
      if (result.success) {
        router.refresh()
        router.push('/dashboard')
      } else {
        setError(result.error ?? 'Conta criada, mas falha ao criar workspace.')
        setLoading(false)
      }
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <span className="text-xl font-bold text-foreground">PipeFlow</span>
            </div>
            <div className="flex items-center justify-center py-2">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Confirme seu e-mail</CardTitle>
            <CardDescription className="text-center">
              Enviamos um link de confirmação para
            </CardDescription>
            <p className="text-center font-medium text-foreground text-sm">{email}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm text-blue-800 dark:text-blue-300 space-y-2">
              <p className="font-medium">O que fazer agora:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                <li>Abra o e-mail que enviamos para a caixa de entrada</li>
                <li>Clique no link <span className="font-medium">&quot;Confirmar e-mail&quot;</span></li>
                <li>Você será redirecionado automaticamente para o sistema</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Não recebeu? Verifique a pasta de spam ou{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
                onClick={() => { setEmailSent(false); setError('') }}
              >
                tente novamente
              </button>
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Já confirmei, ir para o login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-foreground">PipeFlow</span>
          </div>
          <CardTitle className="text-2xl">
            {existingUser ? 'Criar workspace' : 'Criar conta grátis'}
          </CardTitle>
          <CardDescription>
            {existingUser ? 'Dê um nome para o seu workspace para continuar' : 'Comece a organizar suas vendas hoje'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </div>
            )}
            {!existingUser && (
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!existingUser}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="workspace">Nome da empresa / workspace</Label>
              <Input
                id="workspace"
                type="text"
                placeholder="Minha Empresa"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </div>
            {!existingUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={!existingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required={!existingUser}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading
                ? existingUser ? 'Criando workspace...' : 'Criando conta...'
                : existingUser ? 'Criar workspace' : 'Criar conta grátis'}
            </Button>
            {!existingUser && (
              <p className="text-sm text-muted-foreground text-center">
                Já tem conta?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Entrar
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
