interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-gray-100 animate-pulse rounded-xl ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center space-y-1">
      <Skeleton className="h-3 w-8 mx-auto" />
      <Skeleton className="h-7 w-10 mx-auto" />
    </div>
  )
}

export function ListRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
