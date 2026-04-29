'use client'

export default function ActionListSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6">
      {/* Header with Back button skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 bg-gray-100 rounded-lg w-24" />
        <div className="h-8 bg-gray-200 rounded w-64" />
      </div>

      {/* Filter Card skeleton */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid gap-4 md:flex md:flex-wrap md:items-end">
          <div className="space-y-1 md:w-56">
            <div className="h-4 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-10 bg-gray-50 rounded w-full border border-gray-100" />
          </div>
          <div className="space-y-1 md:w-28">
            <div className="h-4 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-10 bg-gray-50 rounded w-full border border-gray-100" />
          </div>
          <div className="space-y-1 md:w-36">
            <div className="h-4 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-10 bg-gray-50 rounded w-full border border-gray-100" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-1/5" />
          ))}
        </div>
        <div className="p-4 space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-4 bg-gray-100 rounded w-1/5" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
