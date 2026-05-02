export default function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[1, 2].map((item) => (
        <div key={item} className="h-80 animate-pulse rounded-lg bg-white p-6 shadow">
          <div className="mb-6 h-6 w-40 rounded bg-gray-200" />
          <div className="h-56 rounded bg-gray-50" />
        </div>
      ))}
    </div>
  )
}
