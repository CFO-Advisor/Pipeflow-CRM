import Link from 'next/link'
import {
  ArrowRight, BarChart3, Kanban, Users, Check,
  Building2, ShieldCheck, GitBranch, Paperclip,
  Zap, Activity, TrendingUp, Headphones, ListChecks,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DOT_GRID_SM = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='1' cy='1' r='0.7' fill='%23ffffff'/%3E%3C/svg%3E")`
const DOT_GRID_LG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff'/%3E%3C/svg%3E")`

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Sales Flow</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors duration-150">Funcionalidades</a>
            <a href="#planos" className="hover:text-foreground transition-colors duration-150">Planos</a>
            <a href="#precos" className="hover:text-foreground transition-colors duration-150">Preços</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground text-sm">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-600/25 px-4">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[oklch(0.10_0.02_264)] min-h-[700px] flex items-center">
        {/* Gradient mesh */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 50%, oklch(0.35 0.18 264 / 0.35) 0%, transparent 60%),
              radial-gradient(ellipse 60% 70% at 80% 30%, oklch(0.35 0.20 295 / 0.30) 0%, transparent 55%),
              radial-gradient(ellipse 50% 50% at 50% 100%, oklch(0.25 0.15 280 / 0.25) 0%, transparent 70%)
            `,
          }}
        />
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{ backgroundImage: DOT_GRID_LG, backgroundSize: '32px 32px' }}
        />
        {/* Orb 1 — azul */}
        <div
          aria-hidden
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-orb-1 pointer-events-none"
          style={{ background: 'oklch(0.55 0.22 264)' }}
        />
        {/* Orb 2 — violeta */}
        <div
          aria-hidden
          className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] animate-orb-2 pointer-events-none"
          style={{ background: 'oklch(0.52 0.25 295)' }}
        />
        {/* Orb 3 — índigo */}
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px] animate-orb-3 pointer-events-none"
          style={{ background: 'oklch(0.48 0.20 280)' }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm text-blue-300 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            CRM para times de vendas
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-[1.06] mb-6 tracking-tighter text-white">
            Organize suas vendas,<br />
            <span
              className="animate-gradient-text bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, oklch(0.72 0.18 220), oklch(0.78 0.22 264), oklch(0.75 0.20 295), oklch(0.72 0.18 220))',
                backgroundSize: '200% auto',
              }}
            >
              feche mais negócios
            </span>
          </h1>

          <p className="text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Pipeline Kanban visual, gestão completa de leads e métricas em um só lugar.
            Do time pequeno ao grupo empresarial com múltiplas empresas.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-base shadow-xl shadow-blue-600/40 transition-all duration-200 hover:shadow-blue-500/50 hover:-translate-y-0.5"
              >
                Começar grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 px-8 h-12 text-base backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-200"
              >
                Ver demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-white/35 mt-5">Sem cartão de crédito · Plano grátis para sempre</p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { value: '2.400+', label: 'leads gerenciados' },
              { value: '340+',   label: 'empresas ativas' },
              { value: '98%',    label: 'satisfação' },
              { value: '< 1 min', label: 'para começar' },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-6 py-8">
                <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-5 px-3 py-1">Funcionalidades</Badge>
            <h2 className="text-4xl font-bold tracking-tighter mb-4">
              Tudo que seu time de vendas precisa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
              Do primeiro contato ao fechamento, o Sales Flow acompanha cada etapa do seu processo comercial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Kanban className="w-7 h-7 text-blue-600" />,
                iconGrad: 'from-blue-500/15 to-blue-600/5',
                iconBorder: 'border-blue-500/20',
                hoverBorder: 'hover:border-blue-500/50',
                title: 'Pipeline Kanban',
                desc: 'Visualize todos os seus negócios em um pipeline drag-and-drop. Mova cards entre etapas com um clique e tenha visão completa do seu funil de vendas.',
              },
              {
                icon: <Users className="w-7 h-7 text-violet-600" />,
                iconGrad: 'from-violet-500/15 to-violet-600/5',
                iconBorder: 'border-violet-500/20',
                hoverBorder: 'hover:border-violet-500/50',
                title: 'Gestão de Leads',
                desc: 'Cadastro completo de leads com histórico de atividades. Registre ligações, e-mails, reuniões e notas diretamente no perfil do contato.',
              },
              {
                icon: <BarChart3 className="w-7 h-7 text-emerald-600" />,
                iconGrad: 'from-emerald-500/15 to-emerald-600/5',
                iconBorder: 'border-emerald-500/20',
                hoverBorder: 'hover:border-emerald-500/50',
                title: 'Dashboard de Métricas',
                desc: 'Acompanhe taxa de conversão, valor total do pipeline e gráfico de funil em tempo real. Tome decisões baseadas em dados.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 ${f.hoverBorder}`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.iconGrad} border ${f.iconBorder} flex items-center justify-center mb-6`}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Banner FREE ── */}
      <section className="py-10 bg-muted/20" id="planos">
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="relative rounded-3xl overflow-hidden p-10 md:p-14 text-white"
            style={{
              background: 'linear-gradient(135deg, oklch(0.52 0.17 162) 0%, oklch(0.44 0.15 150) 100%)',
              backgroundImage: `${DOT_GRID_SM}, linear-gradient(135deg, oklch(0.52 0.17 162) 0%, oklch(0.44 0.15 150) 100%)`,
              backgroundSize: '24px 24px, 100% 100%',
            }}
          >
            <span aria-hidden className="absolute -right-6 -top-6 text-[180px] font-black leading-none select-none pointer-events-none text-white/[0.05]">
              FREE
            </span>
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-200/80">
                  Plano Free — Para sempre
                </span>
                <h2 className="text-4xl font-bold tracking-tighter mb-4 leading-tight">
                  Comece agora,<br />
                  <span className="text-emerald-200">sem pagar nada</span>
                </h2>
                <p className="text-white/65 text-base leading-relaxed mb-8 max-w-sm">
                  Crie sua conta em menos de um minuto e comece a organizar suas vendas hoje mesmo.
                  Pipeline, atividades e dashboard — sem cartão de crédito.
                </p>
                <Link href="/register">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-6 h-11 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all">
                    Criar conta grátis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-white/35 text-sm mt-3">Sem limite de tempo · Sem cartão de crédito</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Zap className="w-5 h-5" />, title: 'Rápido para começar', desc: 'Cadastro em 1 minuto, pipeline pronto para usar imediatamente' },
                  { icon: <Kanban className="w-5 h-5" />, title: 'Pipeline Kanban', desc: 'Drag-and-drop visual com 6 etapas de venda configuradas' },
                  { icon: <Activity className="w-5 h-5" />, title: 'Registro de atividades', desc: 'Ligações, e-mails, reuniões e notas no perfil de cada lead' },
                  { icon: <BarChart3 className="w-5 h-5" />, title: 'Dashboard básico', desc: 'Métricas de conversão e valor do pipeline em tempo real' },
                ].map((item) => (
                  <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors duration-150">
                    <div className="text-emerald-200 mb-2.5">{item.icon}</div>
                    <p className="font-semibold text-sm mb-1 leading-tight">{item.title}</p>
                    <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Banner PRO ── */}
      <section className="py-10 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="relative rounded-3xl overflow-hidden p-10 md:p-14 text-white"
            style={{
              background: 'linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.40 0.24 264) 100%)',
              backgroundImage: `${DOT_GRID_SM}, linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.40 0.24 264) 100%)`,
              backgroundSize: '24px 24px, 100% 100%',
            }}
          >
            <span aria-hidden className="absolute -right-6 -top-6 text-[180px] font-black leading-none select-none pointer-events-none text-white/[0.05]">
              PRO
            </span>
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              {/* Feature cards — à esquerda */}
              <div className="grid grid-cols-2 gap-3 order-2 md:order-1">
                {[
                  { icon: <Users className="w-5 h-5" />, title: 'Colaboradores ilimitados', desc: 'Convide todo o seu time por e-mail sem limite de usuários' },
                  { icon: <ListChecks className="w-5 h-5" />, title: 'Leads ilimitados', desc: 'Sem teto: cadastre quantos leads o seu negócio precisar' },
                  { icon: <TrendingUp className="w-5 h-5" />, title: 'Dashboard avançado', desc: 'Funil de vendas, negócios com prazo e métricas completas' },
                  { icon: <Headphones className="w-5 h-5" />, title: 'Suporte prioritário', desc: 'Atendimento rápido para resolver dúvidas e problemas' },
                ].map((item) => (
                  <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors duration-150">
                    <div className="text-blue-200 mb-2.5">{item.icon}</div>
                    <p className="font-semibold text-sm mb-1 leading-tight">{item.title}</p>
                    <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              {/* Texto — à direita */}
              <div className="order-1 md:order-2">
                <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-blue-200/80">
                  Plano Pro — R$ 49/mês
                </span>
                <h2 className="text-4xl font-bold tracking-tighter mb-4 leading-tight">
                  Escale seu time<br />
                  <span className="text-blue-200">sem limites</span>
                </h2>
                <p className="text-white/65 text-base leading-relaxed mb-8 max-w-sm">
                  Colaboradores e leads ilimitados, convite por e-mail, dashboard avançado com funil
                  de vendas e suporte prioritário. Tudo que seu time precisa para crescer.
                </p>
                <Link href="/register">
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 h-11 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all">
                    Assinar Pro — R$ 49/mês
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-white/35 text-sm mt-3">Cancele quando quiser · Por workspace</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Banner MAX ── */}
      <section className="py-10 pb-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="relative rounded-3xl overflow-hidden p-10 md:p-14 text-white"
            style={{
              background: 'linear-gradient(135deg, oklch(0.50 0.23 295) 0%, oklch(0.42 0.25 285) 100%)',
              backgroundImage: `${DOT_GRID_SM}, linear-gradient(135deg, oklch(0.50 0.23 295) 0%, oklch(0.42 0.25 285) 100%)`,
              backgroundSize: '24px 24px, 100% 100%',
            }}
          >
            <span aria-hidden className="absolute -right-6 -top-6 text-[180px] font-black leading-none select-none pointer-events-none text-white/[0.05]">
              MAX
            </span>
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-violet-200/80">
                  Plano MAX — R$ 100/mês
                </span>
                <h2 className="text-4xl font-bold tracking-tighter mb-4 leading-tight">
                  Para grupos com<br />
                  <span className="text-violet-200">múltiplas empresas</span>
                </h2>
                <p className="text-white/65 text-base leading-relaxed mb-8 max-w-sm">
                  Gerencie várias empresas do seu grupo em um único workspace. Controle de acesso
                  hierárquico, permissões por papel e funil segmentado por empresa.
                </p>
                <Link href="/register">
                  <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-semibold px-6 h-11 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all">
                    Assinar MAX — R$ 100/mês
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-white/35 text-sm mt-3">Cancele quando quiser · Por workspace</p>
              </div>
              <div className="space-y-3">
                <p className="flex items-center gap-1.5 text-violet-200/70 text-xs font-medium mb-4">
                  <ChevronRight className="w-3.5 h-3.5" /> Inclui tudo do Plano Pro
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Building2 className="w-5 h-5" />, title: 'Multi-empresa', desc: 'Gerencie várias empresas do grupo no mesmo CRM com filtros por empresa' },
                    { icon: <GitBranch className="w-5 h-5" />, title: 'Hierarquia de vendas', desc: 'Master → Diretor → Gerente → Vendedor com dados segmentados' },
                    { icon: <ShieldCheck className="w-5 h-5" />, title: 'Controle de acesso', desc: 'Cada vendedor vê apenas seus leads; gerentes, os da equipe' },
                    { icon: <Paperclip className="w-5 h-5" />, title: 'Anexos por negócio', desc: 'Proposta, cotação e apresentações anexadas diretamente no card' },
                  ].map((item) => (
                    <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors duration-150">
                      <div className="text-violet-200 mb-2.5">{item.icon}</div>
                      <p className="font-semibold text-sm mb-1 leading-tight">{item.title}</p>
                      <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-28" id="precos">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-5 px-3 py-1">Preços</Badge>
            <h2 className="text-4xl font-bold tracking-tighter mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground text-lg">
              Comece grátis e faça upgrade quando precisar de mais.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">

            {/* Free */}
            <div className="relative pt-5 flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-700/40">
                  ✦ Grátis para sempre
                </span>
              </div>
            <Card className="border-emerald-600 shadow-2xl shadow-emerald-600/15 ring-2 ring-emerald-600 flex flex-col flex-1 relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_-10px_oklch(0.52_0.17_162_/_0.3)] hover:-translate-y-1.5">
              <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600 absolute top-0 left-0" />
              <CardHeader className="pt-7">
                <Badge variant="secondary" className="w-fit text-xs">Grátis</Badge>
                <CardTitle className="text-3xl mt-3 tracking-tight">R$ 0</CardTitle>
                <p className="text-muted-foreground text-sm">Para sempre</p>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-3 flex-1">
                  {[
                    'Até 2 colaboradores',
                    'Até 50 leads',
                    'Pipeline Kanban completo',
                    'Registro de atividades',
                    'Dashboard básico',
                    'Anexos por negócio',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block pt-6">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30">
                    Começar grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>
            </div>

            {/* Pro */}
            <div className="relative pt-5 flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-blue-700/40">
                  ✦ Mais popular
                </span>
              </div>
            <Card className="border-blue-600 shadow-2xl shadow-blue-600/15 ring-2 ring-blue-600 flex flex-col flex-1 relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_-10px_oklch(0.48_0.22_264_/_0.3)] hover:-translate-y-1.5">
              <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-700 absolute top-0 left-0" />
              <CardHeader className="pt-7">
                <Badge className="w-fit bg-blue-600 text-white hover:bg-blue-600 text-xs">Pro</Badge>
                <CardTitle className="text-4xl mt-3 tracking-tight">
                  R$ 49<span className="text-base font-normal text-muted-foreground">/mês</span>
                </CardTitle>
                <p className="text-muted-foreground text-sm">Por workspace</p>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-3 flex-1">
                  {[
                    'Colaboradores ilimitados',
                    'Leads ilimitados',
                    'Pipeline Kanban completo',
                    'Registro de atividades',
                    'Dashboard avançado',
                    'Convite por e-mail',
                    'Anexos por negócio',
                    'Suporte prioritário',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block pt-6">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30">
                    Assinar Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>
            </div>

            {/* MAX */}

            <div className="relative pt-5 flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-violet-700/40">
                  ✦ Empresarial
                </span>
              </div>
            <Card className="border-violet-600 shadow-2xl shadow-violet-600/15 ring-2 ring-violet-600 flex flex-col flex-1 relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_-10px_oklch(0.50_0.23_295_/_0.3)] hover:-translate-y-1.5">
              <div className="h-1 w-full bg-gradient-to-r from-violet-400 to-purple-700 absolute top-0 left-0" />
              <CardHeader className="pt-7">
                <Badge className="w-fit bg-violet-600 text-white hover:bg-violet-600 text-xs">MAX</Badge>
                <CardTitle className="text-4xl mt-3 tracking-tight">
                  R$ 100<span className="text-base font-normal text-muted-foreground">/mês</span>
                </CardTitle>
                <p className="text-muted-foreground text-sm">Por workspace</p>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-3 flex-1">
                  {[
                    { text: 'Tudo do plano Pro', highlight: true },
                    { text: 'Múltiplas empresas no grupo' },
                    { text: 'Hierarquia de vendas completa' },
                    { text: 'Controle de acesso por empresa' },
                    { text: 'Permissões configuráveis por papel' },
                    { text: 'Funil segmentado por empresa' },
                    { text: 'Filtros por empresa no dashboard' },
                    { text: 'Suporte premium' },
                  ].map((f) => (
                    <li key={f.text} className={`flex items-center gap-2.5 text-sm ${f.highlight ? 'text-violet-600 dark:text-violet-400 font-medium' : 'text-muted-foreground'}`}>
                      <Check className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block pt-6">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/30">
                    Assinar MAX
                  </Button>
                </Link>
              </CardContent>
            </Card>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative overflow-hidden py-28">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, oklch(0.38 0.22 264) 0%, oklch(0.43 0.24 280) 50%, oklch(0.36 0.22 295) 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: DOT_GRID_SM, backgroundSize: '24px 24px' }}
        />
        <div aria-hidden className="absolute -left-24 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-25 blur-[80px] pointer-events-none" style={{ background: 'oklch(0.65 0.20 220)' }} />
        <div aria-hidden className="absolute -right-24 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-[80px] pointer-events-none" style={{ background: 'oklch(0.60 0.22 295)' }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-4 leading-tight">
            Pronto para organizar<br />suas vendas?
          </h2>
          <p className="text-white/55 mb-10 text-xl leading-relaxed">
            Crie sua conta grátis em menos de 1 minuto e comece a usar hoje mesmo.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 px-10 h-14 text-base font-semibold shadow-2xl shadow-black/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-white/35 text-sm mt-5">Sem cartão de crédito · Configure em menos de 1 minuto</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-semibold text-foreground text-base">Sales Flow</span>
          </div>

          <div className="flex items-center gap-7">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
          </div>

          <p>© 2026 Sales Flow. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
