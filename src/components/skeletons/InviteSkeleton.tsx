export default function InviteSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-pulse rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6 h-7 w-40 rounded bg-gray-200" />
        <div className="mb-4 rounded-md bg-gray-50 p-3">
          <div className="mb-2 h-4 w-40 rounded bg-gray-200" />
          <div className="mb-2 h-4 w-56 rounded bg-gray-100" />
          <div className="h-4 w-48 rounded bg-gray-100" />
        </div>
        <div className="space-y-4">
          <div className="h-10 rounded border border-gray-100 bg-gray-50" />
          <div className="h-10 rounded border border-gray-100 bg-gray-50" />
          <div className="h-10 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
