export default function AdminTableSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-4 w-28 rounded bg-gray-100" />
        <div className="h-8 w-48 rounded bg-gray-200" />
      </div>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="flex gap-4 border-b border-gray-100 bg-gray-50 p-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="h-6 w-1/4 rounded bg-gray-200" />
          ))}
        </div>
        <div className="space-y-6 p-4">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex gap-4">
              {[1, 2, 3, 4].map((cell) => (
                <div key={cell} className="h-4 w-1/4 rounded bg-gray-100" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
