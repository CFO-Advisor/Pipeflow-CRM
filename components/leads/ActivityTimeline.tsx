import { Phone, Mail, Users, FileText } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import type { ActivityType, ActivityWithAuthor } from '@/types'

const activityConfig: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>, label: string, color: string }> = {
  call: { icon: Phone, label: 'Ligação', color: 'bg-blue-100 text-blue-600' },
  email: { icon: Mail, label: 'E-mail', color: 'bg-purple-100 text-purple-600' },
  meeting: { icon: Users, label: 'Reunião', color: 'bg-orange-100 text-orange-600' },
  note: { icon: FileText, label: 'Nota', color: 'bg-muted text-muted-foreground' },
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
        const config = activityConfig[activity.type as ActivityType]
        const Icon = config.icon
        const authorName =
          activity.author?.user_metadata?.full_name ?? activity.author?.email ?? 'Desconhecido'
        const isLast = index === activities.length - 1

        return (
          <div key={activity.id} className="relative flex gap-3 pb-5">
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">{config.label}</span>
                <span className="text-xs text-muted-foreground">por {authorName}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatRelativeDate(activity.created_at)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{activity.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
