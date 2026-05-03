export default function StudentProfileSkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* Back link skeleton */}
      <div className="h-4 bg-gray-200 rounded w-24 mb-6" />

      {/* Header Card skeleton */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full" />
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="flex gap-4 mt-2">
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-4 bg-gray-100 rounded w-32" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-8 bg-gray-100 rounded-full w-24" />
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded-lg w-32" />
              <div className="h-10 bg-gray-200 rounded-lg w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Contacts and Sharing Grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-[60%_40%] mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-20 bg-gray-50 rounded w-full" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-20 bg-gray-50 rounded w-full" />
        </div>
      </div>

      {/* Progress Charts skeleton */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-[280px] bg-gray-50 rounded w-full" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-[280px] bg-gray-50 rounded w-full" />
        </div>
      </div>

      {/* History Timeline skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 pl-10 relative">
              <div className="absolute left-2.5 w-3 h-3 rounded-full bg-gray-200" />
              <div className="flex-1 bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-12 bg-white rounded border border-gray-100 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
