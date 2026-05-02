export default function StudentsSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6">
      {/* Header and Add Button skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded-lg w-32" />
      </div>

      {/* Filter Card skeleton */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid gap-4 md:flex md:flex-wrap md:items-end">
          <div className="space-y-1 md:w-56">
            <div className="h-4 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-10 bg-gray-50 rounded w-full border border-gray-100" />
          </div>
          <div className="space-y-1 md:w-56">
            <div className="h-4 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-10 bg-gray-50 rounded w-full border border-gray-100" />
          </div>
          <div className="space-y-1 md:w-28">
            <div className="h-4 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-10 bg-gray-50 rounded w-full border border-gray-100" />
          </div>
          <div className="space-y-1 md:w-44">
            <div className="h-4 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-10 bg-gray-50 rounded w-full border border-gray-100" />
          </div>
        </div>
        <div className="grid gap-4 border-t pt-4 md:flex md:flex-wrap md:items-end">
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
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="p-4 space-y-6">
          <div className="flex gap-4 items-center">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-6 bg-gray-100 rounded-full w-1/6" />
            <div className="h-4 bg-blue-100 rounded w-24" />
          </div>
          <div className="flex gap-4 items-center">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-6 bg-gray-100 rounded-full w-1/6" />
            <div className="h-4 bg-blue-100 rounded w-24" />
          </div>
          <div className="flex gap-4 items-center">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-6 bg-gray-100 rounded-full w-1/6" />
            <div className="h-4 bg-blue-100 rounded w-24" />
          </div>
          <div className="flex gap-4 items-center">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-6 bg-gray-100 rounded-full w-1/6" />
            <div className="h-4 bg-blue-100 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
