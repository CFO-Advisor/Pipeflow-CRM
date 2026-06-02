import { Phone, Mail, Users, FileText, Send, Download } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import type { ActivityType, ActivityWithAuthor } from '@/types'

const activityConfig: Record<ActivityType, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
}> = {
  call:     { icon: Phone,     label: 'Ligação',            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  email:    { icon: Mail,      label: 'E-mail',             color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  meeting:  { icon: Users,     label: 'Reunião',            color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  note:     { icon: FileText,  label: 'Nota',               color: 'bg-muted text-muted-foreground' },
  proposal: { icon: Send,      label: 'Envio de Proposta',  color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
}

interface ActivityTimelineProps {
  activities: ActivityWithAuthor[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhuma atividade registrada ainda.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => {
        const config = activityConfig[activity.type as ActivityType] ?? activityConfig.note
        const Icon = config.icon
        const authorName =
          activity.author?.user_metadata?.full_name ?? activity.author?.email ?? 'Desconhecido'
        const isLast = index === activities.length - 1

        return (
          <div key={activity.id} className="relative flex gap-3 pb-5 group">
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 transition-transform duration-150 group-hover:scale-110 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5 rounded-lg px-2 -mx-2 group-hover:bg-muted/40 transition-colors duration-150">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">{config.label}</span>
                <span className="text-xs text-muted-foreground">por {authorName}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatRelativeDate(activity.created_at)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {activity.description}
              </p>

              {/* Anexo de proposta */}
              {activity.attachment_url && activity.attachment_name && (
                <a
                  href={activity.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={activity.attachment_name}
                  className="inline-flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors text-xs font-medium text-foreground group/link"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate max-w-[200px]">{activity.attachment_name}</span>
                  <Download className="w-3 h-3 text-muted-foreground group-hover/link:text-foreground transition-colors flex-shrink-0" />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
