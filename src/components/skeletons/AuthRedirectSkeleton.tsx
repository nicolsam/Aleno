export default function AuthRedirectSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alfabetiza</h1>
          <p className="mt-1 text-sm text-gray-500">Loading</p>
        </div>
      </div>
    </div>
  )
}
