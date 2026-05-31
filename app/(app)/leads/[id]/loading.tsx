import { Skeleton } from '@/components/ui/skeleton'

export default function LeadDetailLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        <Skeleton className="h-3 w-32 mt-2" />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
