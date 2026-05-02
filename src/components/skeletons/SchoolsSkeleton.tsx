export default function SchoolsSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6">
      {/* Header and Add Button skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded-lg w-32" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="h-24 bg-white rounded-lg shadow p-6 flex flex-col justify-center space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
        <div className="h-24 bg-white rounded-lg shadow p-6 flex flex-col justify-center space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
        <div className="h-24 bg-white rounded-lg shadow p-6 flex flex-col justify-center space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    </div>
  )
}
