import Link from 'next/link'
import { ArrowRight, BarChart3, Kanban, Users, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">PipeFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Badge className="mb-6 bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
          CRM para times de vendas
        </Badge>
        <h1 className="text-5xl font-bold text-foreground leading-tight mb-6 tracking-tight">
          Organize suas vendas,<br />
          <span className="text-blue-600">feche mais negócios</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Pipeline Kanban visual, gestão completa de leads e métricas de vendas em um só lugar. Simples como o Pipedrive, acessível para qualquer time.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 h-12 text-base">
              Começar grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8 h-12 text-base">
              Ver demo
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Sem cartão de crédito • Plano grátis para sempre</p>
      </section>

      {/* Features */}
      <section className="bg-muted/40 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground tracking-tight text-center mb-4">
            Tudo que seu time de vendas precisa
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            Do primeiro contato ao fechamento, o PipeFlow acompanha cada etapa do seu processo comercial.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                  <Kanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg tracking-tight">Pipeline Kanban</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Visualize todos os seus negócios em um pipeline drag-and-drop. Mova cards entre etapas com um clique e tenha visão completa do seu funil.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg tracking-tight">Gestão de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Cadastro completo de leads com histórico de atividades. Registre ligações, e-mails, reuniões e notas diretamente no perfil do contato.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg tracking-tight">Dashboard de Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Acompanhe taxa de conversão, valor total do pipeline e gráfico de funil em tempo real. Tome decisões baseadas em dados.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground tracking-tight text-center mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-muted-foreground text-center mb-14">
            Comece grátis e faça upgrade quando precisar de mais.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">Grátis</Badge>
                <CardTitle className="text-2xl mt-3 tracking-tight">R$ 0</CardTitle>
                <p className="text-muted-foreground text-sm">Para sempre</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    'Até 2 colaboradores',
                    'Até 50 leads',
                    'Pipeline Kanban completo',
                    'Registro de atividades',
                    'Dashboard básico',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-6">
                  <Button variant="outline" className="w-full">Começar grátis</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-blue-600 shadow-lg ring-2 ring-blue-600">
              <CardHeader>
                <Badge className="w-fit bg-blue-600 text-white hover:bg-blue-600">Pro</Badge>
                <CardTitle className="text-2xl mt-3 tracking-tight">R$ 49<span className="text-base font-normal text-muted-foreground">/mês</span></CardTitle>
                <p className="text-muted-foreground text-sm">Por workspace</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    'Colaboradores ilimitados',
                    'Leads ilimitados',
                    'Pipeline Kanban completo',
                    'Registro de atividades',
                    'Dashboard avançado',
                    'Convite por e-mail',
                    'Suporte prioritário',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-6">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Começar pro</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
            Pronto para organizar suas vendas?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Crie sua conta grátis em menos de 1 minuto e comece a usar hoje mesmo.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 h-12 text-base font-semibold">
              Criar conta grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-medium text-foreground">PipeFlow</span>
          </div>
          <p>© 2025 PipeFlow. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
