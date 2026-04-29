import DashboardActionListPage from '@/components/dashboard/DashboardActionListPage'
import { getSingleQueryParam } from '@/lib/dashboard-action-lists'

export default async function ImprovedStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const query = await searchParams

  return (
    <DashboardActionListPage
      kind="improved"
      initialMonth={getSingleQueryParam(query.month)}
      initialSchoolId={getSingleQueryParam(query.schoolId)}
      from={getSingleQueryParam(query.from)}
    />
  )
}
