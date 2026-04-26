'use client'

export default function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
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
