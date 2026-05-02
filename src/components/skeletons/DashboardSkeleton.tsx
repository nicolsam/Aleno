export default function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
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

      {/* Top metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-28 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-28 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-28 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
      
      {/* Chart blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-full bg-gray-100 rounded-full w-48 h-48 mx-auto mt-8" />
        </div>
        <div className="h-80 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-4 mt-8">
            <div className="h-6 bg-gray-100 rounded w-full" />
            <div className="h-6 bg-gray-100 rounded w-5/6" />
            <div className="h-6 bg-gray-100 rounded w-4/6" />
            <div className="h-6 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
