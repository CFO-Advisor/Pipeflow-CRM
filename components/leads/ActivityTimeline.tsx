import { Phone, Mail, Users, FileText } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import type { ActivityType, ActivityWithAuthor } from '@/types'

const activityConfig: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>, label: string, color: string }> = {
  call: { icon: Phone, label: 'Ligação', color: 'bg-blue-100 text-blue-600' },
  email: { icon: Mail, label: 'E-mail', color: 'bg-purple-100 text-purple-600' },
  meeting: { icon: Users, label: 'Reunião', color: 'bg-orange-100 text-orange-600' },
  note: { icon: FileText, label: 'Nota', color: 'bg-slate-100 text-slate-600' },
}

interface ActivityTimelineProps {
  activities: ActivityWithAuthor[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-8">
        Nenhuma atividade registrada ainda.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = activityConfig[activity.type as ActivityType]
        const Icon = config.icon
        const authorName =
          activity.author?.user_metadata?.full_name ?? activity.author?.email ?? 'Desconhecido'

        return (
          <div key={activity.id} className="flex gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-700">{config.label}</span>
                <span className="text-xs text-slate-400">por {authorName}</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {formatRelativeDate(activity.created_at)}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{activity.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
