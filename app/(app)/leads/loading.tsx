import { Skeleton } from '@/components/ui/skeleton'

export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-10 sm:w-28 rounded-md flex-shrink-0" />
      </div>

      <Skeleton className="h-10 w-full rounded-md" />

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-6 w-14 rounded-full flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
