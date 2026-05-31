import { Skeleton } from '@/components/ui/skeleton'

export default function BillingLoading() {
  return (
    <div className="max-w-2xl w-full space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Skeleton className="h-9 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    </div>
  )
}
