import DashboardActionListPage from '@/components/dashboard/DashboardActionListPage'
import { getSingleQueryParam } from '@/lib/dashboard-action-lists'

export default async function MissingUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const query = await searchParams

  return (
    <DashboardActionListPage
      kind="missing-updates"
      initialMonth={getSingleQueryParam(query.month)}
      initialSchoolId={getSingleQueryParam(query.schoolId)}
      from={getSingleQueryParam(query.from)}
    />
  )
}
