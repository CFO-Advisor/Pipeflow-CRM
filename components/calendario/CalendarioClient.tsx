'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Phone, Mail, Users, FileText, CalendarDays, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ── Tipos ────────────────────────────────────────────────────────────
type EventType = 'call' | 'email' | 'meeting' | 'note' | 'deadline'

interface CalendarEvent {
  id: string
  date: string           // YYYY-MM-DD (local)
  type: EventType
  title: string
  description?: string
  userId: string | null  // auth.users.id (assigned_to / author_id)
  memberName?: string
}

interface Member {
  id: string            // workspace_member.id
  userId: string | null // auth.users.id
  email: string
  name?: string
}

interface Props {
  workspaceId: string
  members: Member[]
  currentUserId: string
}

// ── Configurações visuais ────────────────────────────────────────────
const EVENT_CONFIG: Record<EventType, { label: string; icon: React.ElementType; pill: string; dot: string }> = {
  call:     { label: 'Ligação',   icon: Phone,       pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',        dot: 'bg-blue-500' },
  email:    { label: 'E-mail',    icon: Mail,        pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     dot: 'bg-green-500' },
  meeting:  { label: 'Reunião',   icon: Users,       pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', dot: 'bg-violet-500' },
  note:     { label: 'Nota',      icon: FileText,    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',       dot: 'bg-slate-400' },
  deadline: { label: 'Prazo',     icon: Target,      pill: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',           dot: 'bg-red-500' },
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// ── Helpers ──────────────────────────────────────────────────────────
// Usa hora local para evitar bug de fuso horário com toISOString() (UTC)
function localYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMemberDisplay(m: Member): string {
  return m.name ?? m.email.split('@')[0]
}

// ── Componente principal ─────────────────────────────────────────────
export function CalendarioClient({ workspaceId, members, currentUserId }: Props) {
  const today = new Date()
  const [year, setYear]               = useState(today.getFullYear())
  const [month, setMonth]             = useState(today.getMonth())
  const [events, setEvents]           = useState<CalendarEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [filterUserId, setFilterUserId] = useState<string>('all')

  // Mapa keyed por auth.users.id para lookup rápido
  const memberByUserId = new Map(
    members.filter(m => m.userId).map(m => [m.userId!, m])
  )

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const firstDay = new Date(year, month, 1)
    const lastDay  = new Date(year, month + 1, 0)
    const from = localYMD(firstDay)
    const to   = localYMD(lastDay)

    const [{ data: activities }, { data: deals }] = await Promise.all([
      supabase
        .from('activities')
        .select('id, type, description, scheduled_at, author_id, lead:leads(name)')
        .eq('workspace_id', workspaceId)
        .not('scheduled_at', 'is', null)
        .gte('scheduled_at', from)
        .lte('scheduled_at', to),

      supabase
        .from('deals')
        .select('id, title, deadline, assigned_to')
        .eq('workspace_id', workspaceId)
        .not('deadline', 'is', null)
        .gte('deadline', from)
        .lte('deadline', to),
    ])

    const activityEvents: CalendarEvent[] = (activities ?? []).map((a: any) => {
      // author_id → auth.users.id
      const member = a.author_id ? memberByUserId.get(a.author_id) : null
      return {
        id: a.id,
        date: a.scheduled_at as string,
        type: a.type as EventType,
        title: a.lead?.name ?? 'Lead',
        description: a.description,
        userId: a.author_id ?? null,
        memberName: member ? getMemberDisplay(member) : undefined,
      }
    })

    const deadlineEvents: CalendarEvent[] = (deals ?? []).map((d: any) => {
      // assigned_to → auth.users.id
      const member = d.assigned_to ? memberByUserId.get(d.assigned_to) : null
      return {
        id: `deal-${d.id}`,
        date: d.deadline as string,
        type: 'deadline' as EventType,
        title: d.title,
        userId: d.assigned_to ?? null,
        memberName: member ? getMemberDisplay(member) : undefined,
      }
    })

    setEvents([...activityEvents, ...deadlineEvents])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, workspaceId])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }
  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDay(localYMD(today))
  }

  // Filtro por representante (usando auth.users.id)
  const filteredEvents = filterUserId === 'all'
    ? events
    : events.filter(e => e.userId === filterUserId)

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const todayStr     = localYMD(today)

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function eventsForDay(day: number): CalendarEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filteredEvents.filter(e => e.date === dateStr)
  }

  const selectedDayEvents = selectedDay
    ? filteredEvents.filter(e => e.date === selectedDay)
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Calendário</h1>
        <p className="text-muted-foreground text-sm mt-1">Agenda e prazos da equipe de vendas</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* ── Calendário principal ── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-semibold min-w-[180px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToday}
                className="ml-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Hoje
              </button>
            </div>

            {/* Filtro por representante — sempre visível */}
            <select
              value={filterUserId}
              onChange={e => { setFilterUserId(e.target.value); setSelectedDay(null) }}
              className="text-sm rounded-lg border border-input bg-transparent px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30"
            >
              <option value="all">Todos os representantes</option>
              {members.filter(m => m.userId).map(m => (
                <option key={m.userId!} value={m.userId!}>{getMemberDisplay(m)}</option>
              ))}
            </select>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 mb-4">
            {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                {cfg.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Carregando calendário...
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 bg-muted/50">
                {WEEKDAYS.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-border bg-border">
                {cells.map((day, idx) => {
                  if (!day) return (
                    <div key={`empty-${idx}`} className="bg-muted/20 min-h-[90px]" />
                  )

                  const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayEvents = eventsForDay(day)
                  const isToday = dayStr === todayStr
                  const isSelected = dayStr === selectedDay

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : dayStr)}
                      className={cn(
                        'bg-card min-h-[90px] p-1.5 text-left transition-colors hover:bg-muted/40 flex flex-col gap-1',
                        isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
                      )}
                    >
                      <span className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium self-start',
                        isToday
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-foreground',
                      )}>
                        {day}
                      </span>

                      <div className="flex flex-col gap-0.5 w-full">
                        {dayEvents.slice(0, 3).map(ev => {
                          const cfg = EVENT_CONFIG[ev.type]
                          return (
                            <div
                              key={ev.id}
                              className={cn(
                                'flex items-center gap-1 text-[10px] font-medium rounded px-1 py-0.5 w-full',
                                cfg.pill,
                              )}
                              title={ev.title}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                              <span className="truncate">{ev.title}</span>
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted-foreground pl-1">
                            +{dayEvents.length - 3} mais
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Painel lateral ── */}
        <div className="xl:w-72 flex-shrink-0">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm truncate">
                  {selectedDay
                    ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })
                    : 'Selecione um dia'}
                </h3>
              </div>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto max-h-[520px]">
              {!selectedDay && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Clique em um dia para ver os eventos.
                </p>
              )}

              {selectedDay && selectedDayEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum evento neste dia.
                </p>
              )}

              {selectedDayEvents.map(ev => {
                const cfg = EVENT_CONFIG[ev.type]
                const Icon = cfg.icon
                return (
                  <div key={ev.id} className="rounded-lg border border-border p-3 space-y-1.5">
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cfg.pill)}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-snug">{ev.title}</p>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {ev.description}
                      </p>
                    )}
                    {ev.memberName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        {ev.memberName}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
