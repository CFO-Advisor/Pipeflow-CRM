import { Skeleton } from '@/components/ui/skeleton'

export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="-mx-4 lg:mx-0 px-4 lg:px-0">
        <div className="flex gap-3 overflow-x-hidden pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[17rem] sm:w-72 flex-shrink-0">
              <Skeleton className="h-9 rounded-t-lg rounded-b-none" />
              <div className="min-h-[300px] lg:min-h-[400px] rounded-b-lg p-2 space-y-2 bg-muted/50">
                {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : 1 }).map((_, j) => (
                  <div key={j} className="rounded-lg border bg-card p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-3">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
